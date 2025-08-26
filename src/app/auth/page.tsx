"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Auth = () => {
    const [form, setForm] = useState<string>("login");
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const router = useRouter();

    // If already logged in, redirect to home
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/me", { cache: "no-store" });
                if (!cancelled && res.ok) router.replace("/");
            } catch { }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function handleSubmitRegistration(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");

        const res = await fetch("/api/register/self", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
            setMessage(data.error || "Error registering");
        } else {
            router.replace("/");
        }
    }

    async function handleSubmitLogin(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
            setMessage(data.error || "Error logging in");
        } else {
            router.replace("/");
        }

    }

    return (
        <div className="bg-zinc-500 flex justify-center items-center min-h-screen relative">
            {form === "login" ? (
                <form
                    onSubmit={handleSubmitLogin}
                    className="p-6 bg-white shadow-md rounded-xl space-y-4 w-80"
                >
                    <h1 className="text-xl font-bold">Login</h1>
                    <button
                        type="button"
                        onClick={() => setForm("register")}
                        className="text-sm text-blue-600 underline"
                    >
                        Need an account? Register
                    </button>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Login
                    </button>

                    {message && <p className="text-sm text-center mt-2">{message}</p>}
                </form>
            ) : (
                <form
                    onSubmit={handleSubmitRegistration}
                    className="p-6 bg-white shadow-md rounded-xl space-y-4 w-80"
                >
                    <h1 className="text-xl font-bold">Register</h1>
                    <button
                        type="button"
                        onClick={() => setForm("login")}
                        className="text-sm text-blue-600 underline"
                    >
                        Already have an account? Login
                    </button>

                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Register
                    </button>

                    {message && <p className="text-sm text-center mt-2">{message}</p>}
                </form>
            )}
        </div>
    );
}

export default Auth;
