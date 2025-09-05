"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";

type Props = {
    widthFull?: boolean
}

export default function LogoutButton({ widthFull }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    async function handleLogout() {
        try {
            setLoading(true);
            const res = await fetch("/api/logout", { method: "POST", credentials: 'include' });
            if (!res.ok) {
                // Best-effort redirect even if API returns error
                console.warn('Logout failed', await res.text().catch(() => ''))
            }
            router.replace("/");
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
            aria-label="Logout"
            title="Logout"
            className={`flex items-center gap-3 px-4 py-2 rounded-md transition-transform duration-150 bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${widthFull ? 'w-full' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <>
                    <Spinner size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="sr-only">Logging out</span>
                    <span>Logging out…</span>
                </>
            ) : (
                <>
                    <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M16 13v-2H7V8l-5 4 5 4v-3z" />
                        <path d="M20 3H10a2 2 0 00-2 2v3h2V5h10v14H10v-3H8v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
                    </svg>
                    <span>Logout</span>
                </>
            )}
        </button>
    );
}
