"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function ResetPasswordPage() {
    const search = useSearchParams();
    const token = search.get('token') || '';
    const router = useRouter();
    const t = useTranslations('Password');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        if (!token) { setMessage(t('errors.invalidToken')); return; }
        if (password.length < 8 || password.length > 16) { setMessage(t('errors.passwordLength')); return; }
        if (password !== confirm) { setMessage(t('errors.mismatch')); return; }
        try {
            setSubmitting(true);
            const res = await fetch('/api/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // Check if it's a rate limit error (429)
                const errMsg = res.status === 429 ? t('errors.rateLimit') : (data.error || 'Failed');
                setMessage(errMsg);
                return;
            }
            setDone(true);
            setMessage(data.message || t('updated'));
            setTimeout(() => router.replace('/auth?form=login'), 2000);
        } finally { setSubmitting(false); }
    }

    return (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
                    {t('resetTitle')}
                </h2>
            </div>
            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{t('newPassword')}</label>
                            <div className="mt-2">
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('errors.passwordLength')}</p>
                        </div>
                        <div>
                            <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{t('confirmPassword')}</label>
                            <div className="mt-2">
                                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button type="submit" disabled={submitting || done} className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
                                {submitting ? '…' : done ? t('updated') : t('resetTitle')}
                            </button>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('rateLimitWarning')}</p>
                        </div>
                        {message && <p className={`text-sm/6 text-center ${done ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{message}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}