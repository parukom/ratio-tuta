'use client'
import UserForm from '@/components/settings/user/UserForm';
import Tabs from '@/components/ui/Tabs'
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react'
import { useSession } from '@/components/providers/SessionProvider'

const SettingsPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = (searchParams.get('tab') ?? 'user') as 'user' | 'blank';
    const setTab = (t: 'user' | 'blank') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('tab', t);
        router.push(`?${params.toString()}`);
    };
    const session = useSession()
    return (
        <>
            <Tabs
                items={[
                    { key: 'user', label: 'User' },
                    { key: 'blank', label: 'Other' },
                ]}
                activeKey={tab}
                onChange={(k) => setTab(k as 'user' | 'blank')}
            />

            {tab === 'user' && session && (
                <div>
                    <UserForm session={session} />
                </div>
            )}

            {tab === 'user' && !session && (
                <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
            )}

            {tab === 'blank' && (
                <div>
                    {/* Other settings content goes here */}
                </div>
            )}
        </>
    )
}

export default SettingsPage