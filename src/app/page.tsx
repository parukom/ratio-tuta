import React from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getSession } from "@lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="f">
      <header>
        {session ? (
          <div>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/auth"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log in
          </Link>
        )}
      </header>
      <main className="" />
      <footer className="">

      </footer>
    </div>
  );
}
