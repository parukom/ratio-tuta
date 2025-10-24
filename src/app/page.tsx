import React from "react";
import { getSession } from "@lib/session";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import OurMission from '@/components/OurMission';
import Features from '@/components/Features';

export default async function Home() {
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
      redirect('/no-events');
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
    </>
  );
}
