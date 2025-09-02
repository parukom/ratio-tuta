import React from "react";
import { getSession } from "@lib/session";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";
import HeroSection from "@/components/HeroSection";

export default async function Home() {
  const session = await getSession();

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
    });
    if (explicit.length === 0) {
      redirect('/no-events');
    } else if (explicit.length === 1) {
      redirect(`/cash-register?placeId=${explicit[0].placeId}`);
    } else if (explicit.length > 1) {
      redirect('/cash-register');
    }
  }

  return (
    <>
      <HeroSection />
    </>
  );
}
