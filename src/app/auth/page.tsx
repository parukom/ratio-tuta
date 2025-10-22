"use client";

import { Suspense, useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiError } from "@/lib/api-client";

function AuthContent() {
    const t = useTranslations("Auth");
    const searchParams = useSearchParams();
    const formParam = (searchParams.get("form") || "login").toLowerCase();
    const mode: "login" | "register" = formParam === "signup" ? "register" : "login";
    const verifyParam = (searchParams.get("verify") || "").toLowerCase();
    const verifyMessage = verifyParam === "success"
        ? t("verify.success")
        : verifyParam === "invalid"
            ? t("verify.invalid")
            : verifyParam === "error"
                ? t("verify.error")
                : "";
    const verifyStatus: "success" | "warning" | "error" | "" =
        verifyParam === "success" ? "success" : verifyParam === "invalid" ? "warning" : verifyParam === "error" ? "error" : "";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [teamName, setTeamName] = useState("");
    const [remember, setRemember] = useState(false);
    const [message, setMessage] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [showVerifyBanner, setShowVerifyBanner] = useState(true);
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Redirect if already logged in
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);

        if (mode === "login") {
            try {
                // Login is a public endpoint (no session yet), so skip CSRF
                const data = await api.post<{ role?: string }>("/api/login", { email, password, remember }, { skipCsrf: true });

                // Decide where to go next based on role and place memberships
                const role = (data?.role as string) || "USER";
                if (role === 'ADMIN') {
                    router.replace('/dashboard/home');
                    // Keep submitting=true during redirect
                    return;
                }
                try {
                    // Check explicit place memberships
                    const places = await api.get<Array<{ id: string; assignedToMe?: boolean }>>('/api/places');
                    if (Array.isArray(places)) {
                        if (places.length === 0) router.replace('/no-events');
                        else if (places.length === 1) router.replace(`/cash-register?placeId=${places[0].id}`);
                        else {
                            // If exactly one of the returned places is assigned to the user, prefer that place
                            const assigned = places.filter((p) => p.assignedToMe);
                            if (assigned.length === 1) router.replace(`/cash-register?placeId=${assigned[0].id}`);
                            else router.replace('/cash-register');
                        }
                    } else {
                        router.replace('/');
                    }
                    // Keep submitting=true during redirect
                } catch {
                    router.replace('/');
                    // Keep submitting=true during redirect
                }
            } catch (err) {
                // Only re-enable on error
                setSubmitting(false);
                if (err instanceof ApiError) {
                    setMessage(err.message || t("errors.login"));
                } else {
                    setMessage(t("errors.login"));
                }
            }
            return;
        }

        // register
        if (password.length < 8 || password.length > 128) {
            setMessage(t("errors.passwordLength"));
            setSubmitting(false);
            return;
        }
        try {
            // Registration is a public endpoint (no session yet), so skip CSRF
            const data = await api.post<{ message?: string }>("/api/register/self", {
                name,
                email,
                password,
                teamName
            }, { skipCsrf: true });
            setMessage(data.message || t("createdCheckEmail"));
        } catch (err) {
            if (err instanceof ApiError) {
                console.error('Registration error:', err.data);
                const errorMsg = err.message || t("errors.register");
                const details = err.data && typeof err.data === 'object' && 'details' in err.data && Array.isArray(err.data.details)
                    ? ` (${err.data.details.join(', ')})`
                    : '';
                setMessage(errorMsg + details);
            } else {
                setMessage(t("errors.register"));
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
                <div className="auth-bg">
                    <div className="blob bg-blob-a" />
                    <div className="blob bg-blob-b" />
                    <div className="blob bg-blob-c" />
                </div>
            </div>


            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
                    {verifyMessage && showVerifyBanner && (
                        <div
                            className={`mb-6 rounded-md p-3 text-sm ${verifyStatus === 'success'
                                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : verifyStatus === 'warning'
                                    ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                } flex items-start justify-between gap-3`}
                        >
                            <span>{verifyMessage}</span>
                            <button
                                type="button"
                                aria-label={t("dismiss")}
                                onClick={() => setShowVerifyBanner(false)}
                                className="shrink-0 rounded p-1/2 hover:opacity-80"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === "register" && (
                            <div>
                                <label htmlFor="name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                    {t("fields.name")}
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                {t("fields.email")}
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                {t("fields.password")}
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    minLength={mode === "register" ? 8 : undefined}
                                    maxLength={mode === "register" ? 128 : undefined}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                />
                            </div>
                            {mode === "register" && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("fields.passwordRule")}</p>
                            )}
                        </div>

                        {mode === "register" && (
                            <div>
                                <label htmlFor="teamName" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                    {t("fields.teamName")}
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="teamName"
                                        name="teamName"
                                        type="text"
                                        required
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 justify-between">
                            <div className="flex gap-3">
                                <div className="flex h-6 shrink-0 items-center">
                                    <div className="group grid size-4 grid-cols-1">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 forced-colors:appearance-auto"
                                        />
                                        <svg
                                            fill="none"
                                            viewBox="0 0 14 14"
                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25"
                                        >
                                            <path
                                                d="M3 8L6 11L11 3.5"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="opacity-0 group-has-checked:opacity-100"
                                            />
                                            <path
                                                d="M3 7H11"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="opacity-0 group-has-indeterminate:opacity-100"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <label htmlFor="remember-me" className="block text-sm/6 text-gray-900 dark:text-white">
                                    {t("rememberMe")}
                                </label>
                            </div>
                            <div className="text-sm/6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = mode === "login" ? "signup" : "login";
                                        router.replace(`/auth?form=${next}`);
                                    }}
                                    className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    {mode === "login" ? t("toggle.toRegister") : t("toggle.toLogin")}
                                </button>

                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                aria-busy={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                            >
                                {submitting && <Spinner size={18} className="text-white" />}
                                <span>{mode === "login" ? (submitting ? t("submit.loginProgress") : t("submit.login")) : (submitting ? t("submit.registerProgress") : t("submit.register"))}</span>
                            </button>
                            {mode === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => router.replace('/auth/forgot-password')}
                                    className="ml-4 font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        {message && <p className="text-sm/6 text-center text-red-600 dark:text-red-400">{message}</p>}
                        {mode === 'login' && message && /verify/i.test(message) && (
                            <div className="mt-4 text-center space-y-2">
                                <button
                                    type="button"
                                    disabled={resendLoading}
                                    onClick={async () => {
                                        setResendMessage(null);
                                        setResendLoading(true);
                                        try {
                                            // Email verification resend is public endpoint, skip CSRF
                                            await api.post('/api/verify-email/resend', { email }, { skipCsrf: true });
                                            setResendMessage(t('verify.resend.sent'));
                                        } catch {
                                            setResendMessage(t('verify.resend.error'));
                                        } finally {
                                            setResendLoading(false);
                                        }
                                    }}
                                    className="inline-flex items-center justify-center rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                                >
                                    {resendLoading ? t('verify.resend.sending') : t('verify.resend.cta')}
                                </button>
                                {resendMessage && <p className="text-xs text-gray-600 dark:text-gray-400">{resendMessage}</p>}
                            </div>
                        )}
                    </form>

                    {/* <div>
                        <div className="mt-10 flex items-center gap-x-6">
                            <div className="w-full flex-1 border-t border-gray-200 dark:border-white/10" />
                            <p className="text-sm/6 font-medium text-nowrap text-gray-900 dark:text-white">Or continue with</p>
                            <div className="w-full flex-1 border-t border-gray-200 dark:border-white/10" />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <a
                                href="#"
                                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                                </svg>
                                <span className="text-sm/6 font-semibold">Google</span>
                            </a>

                            <a
                                href="#"
                                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                            >
                                <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-[#24292F] dark:fill-white">
                                    <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" fillRule="evenodd" />
                                </svg>
                                <span className="text-sm/6 font-semibold">GitHub</span>
                            </a>
                        </div>
                    </div> */}
                </div>

                {/* <p className="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
                    {mode === "login" ? (
                        <>
                            {t("cta.notMember")} {" "}
                            <button
                                type="button"
                                onClick={() => router.replace("/auth?form=signup")}
                                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {t("cta.startTrial")}
                            </button>
                        </>
                    ) : (
                        <>
                            {t("cta.haveAccount")} {" "}
                            <button
                                type="button"
                                onClick={() => router.replace("/auth?form=login")}
                                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {t("cta.signIn")}
                            </button>
                        </>
                    )}
                </p> */}
            </div>
        </div>
    );
}

export default function Auth() {
    return (
        <Suspense fallback={<div className="py-12" />}>
            <AuthContent />
        </Suspense>
    );
}