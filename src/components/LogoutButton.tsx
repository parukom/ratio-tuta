"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

type Props = {
    widthFull?: boolean
}

export default function LogoutButton({ widthFull }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const t = useTranslations('Common');
    async function handleLogout() {
        try {
            setLoading(true);
            const res = await fetch("/api/logout", { method: "POST", credentials: 'include' });
            if (!res.ok) {
                // Best-effort redirect even if API returns error
                console.warn('Logout failed', await res.text().catch(() => ''))
            }
            // Force a full page reload to /auth to ensure session cookie is cleared
            window.location.href = "/auth";
        } catch (error) {
            console.error('Logout error:', error);
            // Even on error, try to redirect to auth page
            window.location.href = "/auth";
        } finally {
            setLoading(false);
        }
    }
    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            aria-busy={loading}
            aria-label={t('logout')}
            title={t('logout')}
            className={`flex items-center gap-3 px-4 py-2 rounded-md transition-transform duration-150 bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${widthFull ? 'w-full' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <>
                    <Spinner size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="sr-only">{t('loggingOut')}</span>
                    <span>{t('loggingOut')}</span>
                </>
            ) : (
                <>
                    <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span>{t('logout')}</span>
                </>
            )}
        </button>
    );
}
