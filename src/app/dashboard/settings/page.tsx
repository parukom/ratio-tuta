'use client'
import AdminLayout from '@/components/layout/AdminLayout'
import UserForm from '@/components/settings/UserForm';
import Tabs from '@/components/ui/Tabs'
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react'

const SettingsPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = (searchParams.get('tab') ?? 'user') as 'user' | 'blank';
    const setTab = (t: 'user' | 'blank') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('tab', t);
        router.push(`?${params.toString()}`);
    };
    return (
        <AdminLayout>
            <Tabs
                items={[
                    { key: 'user', label: 'User' },
                    { key: 'blank', label: 'Other' },
                ]}
                activeKey={tab}
                onChange={(k) => setTab(k as 'user' | 'blank')}
            />

            {tab === 'user' && (
                <div>
                    <UserForm />
                </div>
            )}

            {tab === 'blank' && (
                <div>
                    {/* Other settings content goes here */}
                </div>
            )}
        </AdminLayout>
    )
}

export default SettingsPage