"use client";
import React from 'react';
import Drawer from '@/components/ui/Drawer';
import { useTranslations } from 'next-intl';
import Dropdown from '@/components/ui/Dropdown';
import LogoutButton from '@/components/LogoutButton';
import Modal from '@/components/modals/Modal';
import { PackageCheck, SlidersHorizontal } from 'lucide-react';
import LanguagePreference from '@/components/admin-zone/settings/user/sections/LanguagePreference';
import toast from 'react-hot-toast';
import { ChangePassword } from '@/components/admin-zone/settings/user/sections/ChangePassword';
import { PersonalInformation } from '@/components/admin-zone/settings/user/sections/PersonalInformation';

type SortKey = 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC';

type Props = {
    open: boolean;
    onClose: () => void;
    inStockOnly: boolean;
    setInStockOnly: (value: React.SetStateAction<boolean>) => void;
    sortKey: SortKey;
    setSortKey: (value: React.SetStateAction<SortKey>) => void;
};

export default function CashRegisterDrawer({ open, onClose, inStockOnly, setInStockOnly, sortKey, setSortKey }: Props) {
    const [openSettings, setOpenSettings] = React.useState(false);
    const t = useTranslations('CashRegister');
    const common = useTranslations('Common');
    const sortLabelMap: Record<SortKey, string> = {
        NAME_ASC: `${common('name', { default: 'Name' })} ↑`,
        PRICE_ASC: `${common('price', { default: 'Price' })} ↑`,
        PRICE_DESC: `${common('price', { default: 'Price' })} ↓`,
        STOCK_DESC: `${t('stock', { default: 'Stock' })} ↓`,
    };

    return (
        <Drawer open={open} onClose={onClose} side="right" title={t('filters', { default: 'Filters' })}>
            <div className="space-y-6 flex flex-col h-full justify-between">
                {/* Filters section */}
                <section className="space-y-6">
                    <section>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('filters', { default: 'Filters' })}
                        </h3>
                        <div className="space-y-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={inStockOnly}
                                onClick={() => setInStockOnly((v) => !v)}
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors
                ${inStockOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/15'}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <PackageCheck className="size-4" /> {t('inStockOnly', { default: 'In stock only' })}
                                </span>
                                <span className={`ml-2 inline-block h-5 w-9 rounded-full bg-gray-200 p-0.5 transition-colors ${inStockOnly ? 'bg-white/30' : ''}`}>
                                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${inStockOnly ? 'translate-x-4' : ''}`} />
                                </span>
                            </button>
                        </div>
                    </section>

                    {/* Sort section */}
                    <section>
                        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <SlidersHorizontal className="size-4" /> {t('sort', { default: 'Sort' })}
                        </h3>
                        <Dropdown
                            align="left"
                            buttonLabel={`${t('sort', { default: 'Sort' })}: ${sortLabelMap[sortKey]}`}
                            items={[
                                { key: 'NAME_ASC', label: sortLabelMap.NAME_ASC },
                                { key: 'PRICE_ASC', label: sortLabelMap.PRICE_ASC },
                                { key: 'PRICE_DESC', label: sortLabelMap.PRICE_DESC },
                                { key: 'STOCK_DESC', label: sortLabelMap.STOCK_DESC },
                            ]}
                            onSelect={(key) => setSortKey(key as SortKey)}
                        />
                    </section>
                </section>

                {/* Actions: Settings + Logout */}
                <section className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setOpenSettings(true)}
                        className="flex items-center gap-3 px-4 py-2 rounded-md transition-transform duration-150 bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 w-full"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-300" aria-hidden="true">
                            <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                            <path d="M19.4 15a1.6 1.6 0 00.3 1.7l.1.1a1 1 0 01-1.4 1.4l-.1-.1a1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5V20a1 1 0 01-2 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.7.3l-.1.1a1 1 0 01-1.4-1.4l.1-.1a1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1H4a1 1 0 010-2h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.7L5.3 6.6a1 1 0 011.4-1.4l.1.1a1.6 1.6 0 001.7.3h.1A1.6 1.6 0 0010 4V3a1 1 0 012 0v.1a1.6 1.6 0 001 1.5h.1a1.6 1.6 0 001.7-.3l.1-.1a1 1 0 011.4 1.4l-.1.1a1.6 1.6 0 00-.3 1.7V9a1.6 1.6 0 001.5 1H20a1 1 0 010 2h-.1a1.6 1.6 0 00-1.5 1z" stroke="currentColor" strokeWidth="0.7" fill="none" />
                        </svg>
                        <span>{t('settings', { default: 'Settings' })}</span>
                    </button>
                    <LogoutButton widthFull />
                </section>

                <Modal open={openSettings} onClose={() => setOpenSettings(false)} size="2xl">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings', { default: 'Settings' })}</h2>
                        <div className="space-y-4">
                            <UserPersonalWrapper />
                            {/* divider */}
                            <div className="border-t border-gray-200 dark:border-gray-700" />
                            <LanguagePreference />
                            <div className="border-t border-gray-200 dark:border-gray-700" />
                            <ChangePassword />
                        </div>
                    </div>
                </Modal>
            </div>
        </Drawer>
    );
}

function UserPersonalWrapper() {
    const [loading, setLoading] = React.useState(true);
    const [first, setFirst] = React.useState('');
    const [last, setLast] = React.useState('');

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/users/me', { credentials: 'include' });
                if (!res.ok) {
                    const msg = `Failed to load user data: ${res.status}`;
                    console.warn(msg);
                    toast.error('Could not load profile data');
                    return;
                }
                const data = await res.json().catch(() => ({}));
                console.debug('UserPersonalWrapper: fetched /api/users/me ->', data);
                if (!cancelled) {
                    // API usually returns a single `name` field (full name). If present, split into first/last.
                    const full = typeof data?.name === 'string' && data.name.trim() ? data.name.trim() : null;
                    if (full) {
                        const parts = full.split(/\s+/);
                        setFirst(parts[0] ?? '');
                        setLast(parts.slice(1).join(' ') ?? '');
                    } else {
                        // Fallback: some responses may include firstName/lastName or givenName/familyName
                        const f = typeof data?.firstName === 'string' ? data.firstName : typeof data?.givenName === 'string' ? data.givenName : '';
                        const l = typeof data?.lastName === 'string' ? data.lastName : typeof data?.familyName === 'string' ? data.familyName : '';
                        setFirst(f ?? '');
                        setLast(l ?? '');
                    }
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                toast.error('Could not load profile data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true };
    }, []);

    if (loading) return <div className="py-4 text-sm text-gray-500">Loading...</div>;

    // Use a key so the inner component remounts when data arrives. This ensures
    // its internal state initializes from the passed props.
    return <PersonalInformation key={`${first}:${last}`} firstName={first} lastName={last} />;
}

// PasswordInline removed: using shared ChangePassword component instead
