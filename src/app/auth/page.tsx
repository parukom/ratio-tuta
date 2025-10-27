"use client";

import { Suspense, useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiError } from "@/lib/api-client";
import { Eye, EyeOff } from "lucide-react";

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
    const [showPassword, setShowPassword] = useState(false);

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
                    // Check if it's a rate limit error (429)
                    const errMsg = err.status === 429
                        ? t("errors.rateLimit")
                        : (err.message || t("errors.login"));
                    setMessage(errMsg);
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
                    {mode === "register" && (
                        <div className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
                            <div className="flex items-start gap-3">
                                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{t("privacy.title")}</h3>
                                    <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">{t("privacy.message")}</p>
                                </div>
                            </div>
                        </div>
                    )}
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
                                <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">{t("fields.nameHint")}</p>
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
                            {mode === "register" && (
                                <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">{t("fields.emailHint")}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                {t("fields.password")}
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    minLength={mode === "register" ? 8 : undefined}
                                    maxLength={mode === "register" ? 128 : undefined}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
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
                                <>
                                    <button
                                        type="button"
                                        onClick={() => router.replace('/auth/forgot-password')}
                                        className="ml-4 font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        Forgot password?
                                    </button>
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t("rateLimitWarning")}</p>
                                </>
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
                </div>

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