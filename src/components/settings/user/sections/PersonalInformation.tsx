'use client'

import React from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

type Props = {
    firstName: string
    lastName: string
    email: string
    setEmail: React.Dispatch<React.SetStateAction<string>>
}

export const PersonalInformation: React.FC<Props> = ({ firstName, lastName, email, setEmail }) => {
    const [first, setFirst] = React.useState(firstName)
    const [last, setLast] = React.useState(lastName)
    const [saving, setSaving] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)

    React.useEffect(() => {
        setFirst(firstName)
    }, [firstName])
    React.useEffect(() => {
        setLast(lastName)
    }, [lastName])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage(null)
        setSaving(true)
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ firstName: first, lastName: last, email }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const err = typeof data?.error === 'string' ? data.error : 'Failed to save changes'
                setMessage(err)
                toast.error(err)
                return
            }
            const msg = typeof data?.message === 'string' ? data.message : 'Saved'
            setMessage(msg)
            toast.success(msg)
        } catch {
            setMessage('Network error')
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
                    Use a permanent address where you can receive mail.
                </p>
            </div>

            <form className="md:col-span-2" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full flex items-center gap-x-8">
                        <Image
                            alt=""
                            src="/images/cat.jpg"
                            className="size-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                            width={96}
                            height={96}
                        />
                        <div>
                            <button
                                type="button"
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                            >
                                Change avatar
                            </button>
                            <p className="mt-2 text-xs/5 text-gray-500 dark:text-gray-400">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                            First name
                        </label>
                        <div className="mt-2">
                            <input
                                id="first-name"
                                name="first-name"
                                type="text"
                                autoComplete="given-name"
                                value={first}
                                onChange={(e) => setFirst(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                            Last name
                        </label>
                        <div className="mt-2">
                            <input
                                id="last-name"
                                name="last-name"
                                type="text"
                                autoComplete="family-name"
                                value={last}
                                onChange={(e) => setLast(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>


                </div>

                {message && (
                    <p className="mt-6 text-sm text-gray-700 dark:text-gray-300">{message}</p>
                )}

                <div className="mt-8 flex">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}
