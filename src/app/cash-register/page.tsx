import { Suspense } from 'react';
import CashRegisterClient from '@components//cash-register/CashRegisterClient';

export default function CashRegisterPage() {
    return (
        <Suspense>
            <CashRegisterClient />
        </Suspense>
    );
}