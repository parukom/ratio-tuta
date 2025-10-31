"use client";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import Dropdown from "@/components/ui/Dropdown";

type Props = { className?: string; align?: 'left' | 'right'; side?: 'top' | 'bottom' }

export default function LanguageSwitcher({ className, align = 'right', side = 'bottom' }: Props) {
    const current = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const [value, setValue] = useState<Locale>(current as Locale);

    async function onChange(next: string) {
        setValue(next as Locale);
        startTransition(async () => {
            try {
                // Save new locale in cookie
                await fetch("/api/locale", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale: next }),
                });

                // Dispatch custom event to notify other components about locale change
                window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: next } }));

                // For URL-based i18n routing, redirect to new locale URL
                // Remove current locale from pathname if it exists
                const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
                const newPath = `/${next}${pathWithoutLocale}`;
                router.push(newPath);
            } catch (error) {
                console.error('Failed to change language:', error);
                // Fallback to reload if navigation fails
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
