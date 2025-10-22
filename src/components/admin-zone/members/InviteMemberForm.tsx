'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'
import Modal from '@/components/modals/Modal'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'

type Props = {
    teamId?: string
    onSuccess?: () => void
}

const AddMember = ({ teamId, onSuccess }: Props) => {
    const t = useTranslations('Common')
    const tt = useTranslations('Team')
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
    const [password, setPassword] = useState<string>('')
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [message, setMessage] = useState<string>('')
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [limitModal, setLimitModal] = useState(false)
    const [limitInfo, setLimitInfo] = useState<null | { allowed: boolean; remaining: number | null; max: number | null }>(null)
    const [checkingLimit, setCheckingLimit] = useState(false)

    function generatePassword(len = 14) {
        // Strong password: upper, lower, digits, symbols
        const upp = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
        const low = 'abcdefghijkmnopqrstuvwxyz'
        const dig = '23456789'
        const sym = '!@#$%^&*()-_=+[]{},.?'
        const all = upp + low + dig + sym
        const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
        const required = [pick(upp), pick(low), pick(dig), pick(sym)]
        const rest = Array.from({ length: Math.max(0, len - required.length) }, () => pick(all))
        const arr = [...required, ...rest]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        setPassword(arr.join(''))
        setShowPassword(true)
    }

    async function copyPassword() {
        if (!password) return
        try {
            await navigator.clipboard.writeText(password)
            setMessage(tt('toasts.passwordCopied'))
            toast.success(t('copy'))
        } catch {
            setMessage(tt('toasts.copyFailed'))
            toast.error(tt('toasts.copyFailed'))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setSubmitting(true)
        try {
            const trimmed = password.trim()
            if (trimmed && (trimmed.length < 8 || trimmed.length > 128)) {
                setMessage(tt('toasts.passwordRule'))
                toast.error(tt('toasts.passwordRule'))
                return
            }
            // Check limit before submission if we have a teamId
            if (teamId) {
                try {
                    setCheckingLimit(true)
                    const li = await api.get<{ allowed: boolean; remaining: number | null; max: number | null }>(`/api/teams/${teamId}/limits/members`)
                    setLimitInfo(li)
                    if (!li.allowed) {
                        setLimitModal(true)
                        toast.error(tt('limit.title', { default: 'Member limit reached' }))
                        return
                    }
                } catch { /* ignore */ } finally { setCheckingLimit(false) }
            }
            const payload: Record<string, unknown> = { name, email, role, teamId }
            if (trimmed.length > 0) payload.password = trimmed

            const data = await api.post<{ error?: string; generatedPassword?: string }>('/api/register/worker', payload)

            if (data.generatedPassword) {
                setPassword(String(data.generatedPassword))
                setShowPassword(true)
                setMessage(tt('toasts.memberCreatedWithPassword'))
                toast.success(tt('toasts.memberCreated'))
            } else {
                setMessage(tt('toasts.memberCreatedAndAdded'))
                toast.success(tt('toasts.memberCreatedAndAdded'))
            }
            setName('')
            setEmail('')
            setRole('USER')
            setPassword('')
            onSuccess?.()
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 403 && (err.message || '').toLowerCase().includes('limit')) {
                    if (teamId) {
                        try {
                            const li = await api.get<{ allowed: boolean; remaining: number | null; max: number | null }>(`/api/teams/${teamId}/limits/members`)
                            setLimitInfo(li)
                        } catch { /* noop */ }
                    }
                    setLimitModal(true)
                    toast.error(tt('limit.title', { default: 'Member limit reached' }))
                    return
                }
                setMessage(err.message || tt('toasts.errorRegistering'))
                toast.error(err.message || tt('toasts.errorRegistering'))
            } else {
                setMessage(tt('toasts.networkError'))
                toast.error(tt('toasts.networkError'))
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{t('inviteMember')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tt('invite.subtitle')}</p>
            </div>

            <Input
                id="name"
                name="name"
                type="text"
                value={name}
                placeholder={t('name')}
                className=""
                onChange={(e) => setName(e.target.value)}
            />

            <Input
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder={tt('email')}
                className=""
                onChange={(e) => setEmail(e.target.value)}
            />

            <div>
                <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{tt('role.label')}</label>
                <div className="mt-2">
                    <Dropdown
                        buttonLabel={role === 'ADMIN' ? tt('roles.admin') : tt('roles.member')}
                        disabled={submitting}
                        items={[
                            { key: 'USER', label: tt('roles.member'), onSelect: () => setRole('USER') },
                            { key: 'ADMIN', label: tt('roles.admin'), onSelect: () => setRole('ADMIN') },
                        ]}
                        onSelect={(key) => setRole(key as 'USER' | 'ADMIN')}
                        align="left"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{tt('password.setOptional')}</label>
                <div className="mt-2 flex gap-2">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        placeholder={tt('password.leaveBlank')}
                        className="flex-1"
                        minLength={8}
                        maxLength={128}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setShowPassword((v) => !v)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                        {showPassword ? t('hide') : t('show')}
                    </button>
                </div>
                <div className="mt-2 flex gap-2">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => generatePassword()}
                        className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                        {t('generatePassword')}
                    </button>
                    <button
                        type="button"
                        disabled={submitting || !password}
                        onClick={copyPassword}
                        className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-60 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                        {t('copy')}
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tt('password.hint')}</p>
            </div>

            <button
                type="submit"
                disabled={submitting || checkingLimit}
                aria-busy={submitting || checkingLimit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
                {(submitting || checkingLimit) && <Spinner size={16} className="text-white" />}
                <span>{(submitting || checkingLimit) ? t('creating') : t('createAndAdd')}</span>
            </button>

            {message && (
                <p className="text-sm text-center mt-1 text-gray-700 dark:text-gray-300">{message}</p>
            )}
            <Modal open={limitModal} onClose={() => setLimitModal(false)}>
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3Z" /></svg>
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{tt('limit.title', { default: 'Member limit reached' })}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {limitInfo?.max != null ? (
                                    tt('limit.body', { max: limitInfo.max, default: `You have reached the maximum of ${limitInfo.max} members allowed on your current plan.` })
                                ) : tt('limit.bodyUnlimited', { default: 'You have reached a limit.' })}
                            </p>
                            {limitInfo?.max != null && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <span>{tt('limit.usageLabel', { default: 'Usage' })}</span>
                                        <span>{Math.max(limitInfo.max - (limitInfo.remaining ?? 0), 0)}/{limitInfo.max}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                        <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all" style={{ width: `${limitInfo.max ? Math.min(100, ((limitInfo.max - (limitInfo.remaining ?? 0)) / limitInfo.max) * 100) : 0}%` }} />
                                    </div>
                                    {limitInfo.remaining === 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">{tt('limit.reachedHint', { default: 'You have used all available members for this plan.' })}</p>
                                    )}
                                </div>
                            )}
                            <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400 list-disc pl-5">
                                <li>{tt('limit.benefitMoreMembers', { default: 'Invite more teammates to collaborate.' })}</li>
                                <li>{tt('limit.benefitHigherPlan', { default: 'Higher plans unlock more items and places too.' })}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button onClick={() => setLimitModal(false)} className="inline-flex justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('close', { default: 'Close' })}</button>
                        <Link href="/pricing" className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                            {tt('limit.upgradeCta', { default: 'Upgrade plan' })}
                        </Link>
                    </div>
                </div>
            </Modal>
        </form>
    )
}

export default AddMember