import Modal from "@/components/modals/Modal";
import { useTranslations } from 'next-intl'

// Conflict modal at page root
export function ConflictModal({ info, onClose }: { info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' | 'box' } | null; onClose: () => void }) {
    const t = useTranslations('Items')
    return (
        <Modal open={!!info} onClose={onClose} size="lg">
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-amber-500/10">
                    <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9-.75a9 9 0 1118 0 9 9 0 01-18 0zm9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div className="mt-3 w-full text-left sm:ml-4 sm:mt-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{info?.kind === 'box' ? t('modals.conflict.cannotDeleteBox') : t('modals.conflict.cannotDeleteItem')}</h3>
                        {typeof info?.places?.length === 'number' && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10">
                                {(info?.places?.length ?? 0)}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{info?.kind === 'box' ? t('modals.conflict.boxAssigned') : t('modals.conflict.itemAssigned')}</p>
                </div>
            </div>

            <div className="mt-4 rounded-xl ring-1 ring-gray-200 dark:ring-white/10 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-white/10">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">{t('modals.conflict.place')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-200">{t('modals.conflict.quantity')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-transparent">
                            {(info?.places ?? []).map((p) => (
                                <tr key={p.placeId} className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.placeName}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10">{p.quantity}</span>
                                    </td>
                                </tr>
                            ))}
                            {(info?.places?.length ?? 0) === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-3 py-4 text-center text-gray-600 dark:text-gray-300">{t('modals.conflict.noUsage')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">{t('modals.conflict.close')}</button>
            </div>
        </Modal>
    )
}