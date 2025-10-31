import React from "react";
import { getSession } from "@lib/session";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import OurMission from '@/components/OurMission';
import Features from '@/components/Features';
import FAQ from '@/components/Faq';
import Footer from '@/components/Footer';
import { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Ratio Tuta - Modern Inventory & Financial Management System",
  description: "Secure, modern inventory tracking and financial management for teams. Real-time stock management, POS system, team collaboration, and comprehensive reporting. Start managing your business efficiently today.",
  keywords: [
    "inventory management system",
    "financial management software",
    "POS system",
    "stock tracking",
    "team collaboration",
    "business management",
    "inventory software",
    "receipt management"
  ],
  openGraph: {
    title: "Ratio Tuta - Modern Inventory & Financial Management",
    description: "Secure inventory tracking and financial management system for modern teams. Real-time stock control, POS, and comprehensive reporting.",
    type: "website",
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : 'en';
  // Fast-path: verify cookie signature and expiry only; skip DB revocation check for a snappier homepage.
  const session = await getSession({ skipDbCheck: true });

  // If user is logged in and is explicitly assigned to a single place,
  // send them straight to the cash register for that place.
  if (session) {
    // Admins go to dashboard by default
    if (session.role === 'ADMIN') {
      redirect('/dashboard/home');
    }

    // Workers (users): route based on place memberships
    const explicit = await prisma.placeMember.findMany({
      where: { userId: session.userId, place: { isActive: true } },
      select: { placeId: true },
      take: 2, // we only need to know if there are 0, 1, or many
    });
    if (explicit.length === 0) {
      redirect('/dashboard/no-events');
    } else if (explicit.length === 1) {
      redirect(`/cash-register?placeId=${explicit[0].placeId}`);
    } else if (explicit.length > 1) {
      redirect('/cash-register');
    }
    else return null; // should not reach here
  }

  return (
    <>
      <HeroSection session={session} />
      <OurMission />
      <Features />
      <HowItWorks />
      <FAQ />
      <Footer />
    </>
  );
}
