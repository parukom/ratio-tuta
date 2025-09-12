import { Suspense } from 'react';
import CashRegisterClient from '@components//cash-register/CashRegisterClient';
import { getSession } from '@lib/session';
import SessionProvider from '@/components/providers/SessionProvider';

export default async function CashRegisterPage() {
    const session = await getSession({ skipDbCheck: true });
    return (
        <Suspense>
            {session ? (
                <SessionProvider value={session}>
                    <CashRegisterClient />
                </SessionProvider>
            ) : (
                <CashRegisterClient />
            )}
        </Suspense>
    );
}