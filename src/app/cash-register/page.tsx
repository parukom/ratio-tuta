import { Suspense } from 'react';
import CashRegisterClient from '@components//cash-register/CashRegisterClient';
import { getSession } from '@lib/session';
import SessionProvider from '@/components/providers/SessionProvider';
import DashboardIntlProvider from '@/components/providers/DashboardIntlProvider';

export default async function CashRegisterPage() {
    const session = await getSession({ skipDbCheck: true });
    return (
        <DashboardIntlProvider>
            <Suspense>
                {session ? (
                    <SessionProvider value={session}>
                        <CashRegisterClient />
                    </SessionProvider>
                ) : (
                    <CashRegisterClient />
                )}
            </Suspense>
        </DashboardIntlProvider>
    );
}