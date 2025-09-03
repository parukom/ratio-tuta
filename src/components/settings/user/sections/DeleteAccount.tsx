import React, { useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'

export const DeleteAccount = () => {
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const phrase = useMemo(() => 'i really want to delete this team and all data related to it', [])
    const [typed, setTyped] = useState('')
    const disabled = submitting || typed.trim() !== phrase

    async function confirmDelete() {
        setMessage(null)
        try {
            setSubmitting(true)
            const res = await fetch('/api/users/me', { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setMessage(data?.error || 'Failed to delete account')
                return
            }
            setMessage('Account deleted. You will be signed out.')
            setOpen(false)
            setTimeout(() => { window.location.href = '/' }, 1000)
        } catch {
            setMessage('Failed to delete account')
        } finally {
            setSubmitting(false)
        }
    }

    async function copyPhrase() {
        try {
            await navigator.clipboard.writeText(phrase)
            setMessage('Text copied. Paste it below to confirm.')
        } catch {
            setMessage('Failed to copy text')
        }
    }
    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Delete account</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
                    No longer want to use our service? You can delete your account here. This action is not reversible.
                    All information related to this account will be deleted permanently.
                </p>
                {message && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>}
            </div>

            <div className="flex items-start md:col-span-2">
                <button
                    type="button"
                    onClick={() => { setMessage(null); setTyped(''); setOpen(true) }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400"
                >
                    Yes, delete my account
                </button>

                <Modal open={open} onClose={() => { if (!submitting) { setOpen(false); setTyped('') } }} size="md">
                    <div className="text-left">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm account deletion</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            This will permanently delete your account and all related data. To confirm, type the following text exactly:
                        </p>

                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirmation text</label>
                            <div className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={phrase}
                                    className="flex-1 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-1 -outline-offset-1 outline-gray-200 dark:bg-white/5 dark:text-gray-200 dark:outline-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={copyPhrase}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                                    title="Copy text"
                                >
                                    <DocumentDuplicateIcon className="h-4 w-4" /> Copy
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-900 dark:text-white">Type the text to proceed</label>
                            <input
                                id="confirm-delete"
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                autoFocus
                                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-red-500"
                                placeholder={phrase}
                            />
                            {typed && typed.trim() !== phrase && (
                                <p className="mt-1 text-xs text-red-600">Text does not match.</p>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { if (!submitting) { setOpen(false); setTyped('') } }}
                                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:opacity-60 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400"
                            >
                                {submitting ? 'Deleting…' : 'Delete account'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
