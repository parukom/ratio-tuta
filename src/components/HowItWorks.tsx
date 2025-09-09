import React from "react";
import Link from "next/link";
import Image from "next/image";

const steps = [
  {
    step: "01",
    title: "Create your secure space",
    desc: "Start a private notebook and decide who can view or edit with roles.",
  },
  {
    step: "02",
    title: "Write and structure",
    desc: "Capture notes, add tables and checklists, and link related pages together.",
  },
  {
    step: "03",
    title: "Add formulas",
    desc: "Reference cells and pages; totals and summaries update automatically.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 dark:bg-gray-900/40">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">How it works</h2>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            From blank page to calculated report in minutes.
          </p>
        </div>

        <ol className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-10 sm:gap-12">
          {steps.map((s) => (
            <li key={s.step} className="relative flex gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-gray-950">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                {s.step}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{s.desc}</p>
                <div className="mt-4 h-36 w-full overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
                  <Image width={300} height={300} src="https://www.thispersondoesnotexist.com" alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-12 flex max-w-3xl items-center justify-center">
          <Link href="/auth" className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}
