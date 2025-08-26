"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    async function handleLogout() {
        try {
            setLoading(true);
            await fetch("/api/logout", { method: "POST" });
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
            className="px-6 py-2 rounded bg-red-800 text-white hover:bg-red-700 transition-all duration-300 disabled:opacity-60"
        >
            {loading ? "Logging out..." : "Logout"}
        </button>
    );
}
