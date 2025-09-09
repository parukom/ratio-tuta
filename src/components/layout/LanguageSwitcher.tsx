"use client";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import Dropdown from "@/components/ui/Dropdown";

type Props = { className?: string; align?: 'left' | 'right'; side?: 'top' | 'bottom' }

export default function LanguageSwitcher({ className, align = 'right', side = 'bottom' }: Props) {
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

    const items = locales.map((loc) => ({ key: loc, label: loc.toUpperCase() }));

    return (
        <div className={className} aria-label="Language">
            <Dropdown
                buttonLabel={value.toUpperCase()}
                items={items}
                onSelect={onChange}
                align={align}
                side={side}
                disabled={pending}
            />
        </div>
    );
}
