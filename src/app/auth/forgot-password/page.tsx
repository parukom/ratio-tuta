"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const t = useTranslations('Password');

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        if (!email.trim()) { setMessage(t('errors.emailRequired')); return; }
        try {
            setSubmitting(true);
            const res = await fetch('/api/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
            const data = await res.json().catch(() => ({}));
            setMessage(data.message || t('forgotSent'));
        } finally { setSubmitting(false); }
    }

    return (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">{t('forgotTitle')}</h2>
            </div>
            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">Email</label>
                            <div className="mt-2">
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
                                {submitting ? '…' : t('forgotCta')}
                            </button>
                        </div>
                        {message && <p className="text-sm/6 text-center text-gray-700 dark:text-gray-300">{message}</p>}
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={() => router.replace('/auth?form=login')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">←</button>
                    </div>
                </div>
            </div>
        </div>
    );
}