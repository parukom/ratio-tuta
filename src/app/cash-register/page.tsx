import { Suspense } from 'react';
import CashRegisterClient from './CashRegisterClient';

export default function CashRegisterPage() {
    return (
        <Suspense>
            <CashRegisterClient />
        </Suspense>
    );
}