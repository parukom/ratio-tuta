"use client";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ className }: { className?: string }) {
    const current = useLocale();
    const [pending, startTransition] = useTransition();
    const [value, setValue] = useState<Locale>(current as Locale);

    async function onChange(next: string) {
        setValue(next as Locale);
        startTransition(async () => {
            try {
                await fetch("/api/locale", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale: next }),
                });
            } finally {
                // refresh to apply new messages on server-rendered routes
                window.location.reload();
            }
        });
    }

    return (
        <select
            className={className ?? "rounded-md border bg-white/80 px-2 py-1 text-sm dark:bg-gray-800/60"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Language"
            disabled={pending}
        >
            {locales.map((loc) => (
                <option key={loc} value={loc}>
                    {loc.toUpperCase()}
                </option>
            ))}
        </select>
    );
}
