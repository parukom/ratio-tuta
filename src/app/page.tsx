import React from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getSession } from "@lib/session";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";

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
    <div className="p-6">
      <header className="flex items-center justify-between">
        {session ? (
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        ) : (
          <Link href="/auth" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Log in
          </Link>
        )}
      </header>
      <main className="mt-10">
        {session ? (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">Choose where to work today:</p>
            <Link href="/cash-register" className="inline-block rounded bg-gray-800 px-4 py-2 text-white">
              Open Cash Register
            </Link>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Welcome to Ratio tuta</p>
        )}
      </main>
    </div>
  );
}
