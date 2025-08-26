'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'

type Props = {
    teamId?: number
    onSuccess?: () => void
}

const AddMember = ({ teamId, onSuccess }: Props) => {
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
    const [message, setMessage] = useState<string>('')
    const [submitting, setSubmitting] = useState<boolean>(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setSubmitting(true)
        try {
            const res = await fetch('/api/register/worker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, role, teamId }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage(data.error || 'Error registering')
                return
            }
            setMessage('Member created and added!')
            setName('')
            setEmail('')
            setRole('USER')
            onSuccess?.()
        } catch {
            setMessage('Network error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Add member</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new account and add them to your team.</p>
            </div>

            <Input
                id="name"
                name="name"
                type="text"
                value={name}
                placeholder="Name"
                className=""
                onChange={(e) => setName(e.target.value)}
            />

            <Input
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Email"
                className=""
                onChange={(e) => setEmail(e.target.value)}
            />

            <div>
                <label htmlFor="role" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                    User role
                </label>
                <div className="mt-2">
                    <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                        disabled={submitting}
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
                {submitting ? 'Creating…' : 'Create and add'}
            </button>

            {message && (
                <p className="text-sm text-center mt-1 text-gray-700 dark:text-gray-300">{message}</p>
            )}
        </form>
    )
}

export default AddMember