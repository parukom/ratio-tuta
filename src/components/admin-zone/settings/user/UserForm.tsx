'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { SessionData } from '@lib/session'
import { PersonalInformation } from './sections/PersonalInformation';
import { ChangePassword } from './sections/ChangePassword';
import { LogoutOtherSessions } from './sections/LogoutOtherSessions';
import { DeleteAccount } from './sections/DeleteAccount';

type Props = { session: SessionData }

function splitName(full: string): { firstName: string; lastName: string } {
    const parts = (full || '').trim().split(/\s+/)
    if (parts.length === 0) return { firstName: '', lastName: '' }
    if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' }
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

const UserForm: React.FC<Props> = ({ session }) => {
    const { firstName, lastName } = useMemo(() => splitName(session?.name ?? ''), [session?.name])
    const [email, setEmail] = useState<string>('')
    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const res = await fetch('/api/users/me', { credentials: 'include' })
                if (!res.ok) return
                const data: { email?: string } = await res.json()
                if (!cancelled) setEmail(data?.email ?? '')
            } catch { /* ignore */ }
        }
        load()
        return () => { cancelled = true }
    }, [])

    return (
        <div className="divide-y divide-gray-200 dark:divide-white/10">
            <PersonalInformation
                firstName={firstName}
                lastName={lastName}
                email={email}
                setEmail={setEmail}
            />

            <ChangePassword />

            <LogoutOtherSessions />

            <DeleteAccount />
        </div>
    )
}

export default UserForm;
