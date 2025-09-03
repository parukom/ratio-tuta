import React, { useState } from 'react'

export const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage(null)

        const cur = currentPassword.trim()
        const nw = newPassword.trim()
        const cf = confirmPassword.trim()

        if (!cur || !nw || !cf) {
            setMessage('Please fill in all fields')
            return
        }
        if (nw.length < 8 || nw.length > 16) {
            setMessage('Password must be 8-16 characters')
            return
        }
        if (nw !== cf) {
            setMessage('Passwords do not match')
            return
        }

        try {
            setSubmitting(true)
            const res = await fetch('/api/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setMessage(data?.error || 'Failed to update password')
                return
            }
            setMessage('Password updated')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch {
            setMessage('Failed to update password')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Change password</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
                    Update your password associated with your account.
                </p>
                {message && (
                    <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>
                )}
            </div>

            <form className="md:col-span-2" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full">
                        <label
                            htmlFor="current-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            Current password
                        </label>
                        <div className="mt-2">
                            <input
                                id="current-password"
                                name="current_password"
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label
                            htmlFor="new-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            New password
                        </label>
                        <div className="mt-2">
                            <input
                                id="new-password"
                                name="new_password"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            Confirm password
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirm-password"
                                name="confirm_password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Password must be 8-16 characters.</p>
                    </div>
                </div>

                <div className="mt-8 flex">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {submitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}
