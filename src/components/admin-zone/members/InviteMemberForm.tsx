'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'

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
            if (trimmed && (trimmed.length < 8 || trimmed.length > 16)) {
                setMessage(tt('toasts.passwordRule'))
                toast.error(tt('toasts.passwordRule'))
                return
            }
            const payload: Record<string, unknown> = { name, email, role, teamId }
            if (trimmed.length > 0) payload.password = trimmed
            const res = await fetch('/api/register/worker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data: { error?: string; generatedPassword?: string } = await res.json()
            if (!res.ok) {
                setMessage(data.error || tt('toasts.errorRegistering'))
                toast.error(data.error || tt('toasts.errorRegistering'))
                return
            }
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
        } catch {
            setMessage(tt('toasts.networkError'))
            toast.error(tt('toasts.networkError'))
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
                        maxLength={16}
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
                disabled={submitting}
                aria-busy={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
                {submitting && <Spinner size={16} className="text-white" />}
                <span>{submitting ? t('creating') : t('createAndAdd')}</span>
            </button>

            {message && (
                <p className="text-sm text-center mt-1 text-gray-700 dark:text-gray-300">{message}</p>
            )}
        </form>
    )
}

export default AddMember