'use client'

// Using native <img> to avoid Next.js remote image domain requirements
import { ItemRow } from './types'
import { useTranslations } from 'next-intl'
import Drawer from '@/components/ui/Drawer'

type Props = {
    open: boolean
    onClose: () => void
    item: ItemRow | null
}

const fmtCurrency = (v: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(v)

const ItemInfoDrawer = ({ open, onClose, item }: Props) => {
    const t = useTranslations('Items')
    const currency = item?.currency || 'EUR'
    const imageSrc = item?.imageUrl || '/images/no-image.jpg'

    return (
        <Drawer open={open} onClose={onClose} side="right" title={item?.name || t('drawer.info')} widthClassName="w-screen max-w-lg">
            <div className="space-y-6">
                {/* Header image and meta */}
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt={item?.name || t('drawer.itemPictureAlt')}
                        src={imageSrc}
                        className="block aspect-10/7 w-full rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                    />
                    <div className="mt-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item?.categoryName || t('forms.noCategory')}</p>
                    </div>
                </div>

                {/* Information */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.info')}</h3>
                    <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
                        <InfoRow label={t('labels.status')} value={item?.isActive ? t('labels.active') : t('labels.inactive')} />
                        <InfoRow label={t('labels.sku')} value={item?.sku || '—'} />
                        <InfoRow label={t('labels.price')} value={item ? fmtCurrency(item.price, currency) : '—'} />
                        {typeof item?.pricePaid === 'number' && (
                            <InfoRow label={t('labels.cost')} value={fmtCurrency(item!.pricePaid!, currency)} />
                        )}
                        {typeof item?.pricePaid === 'number' && (
                            <InfoRow label={t('labels.profit')} value={fmtCurrency((item!.price - (item!.pricePaid || 0)), currency)} />
                        )}
                        <InfoRow label={t('labels.tax')} value={item ? `${(item.taxRateBps / 100).toFixed(2)}%` : '—'} />
                        <InfoRow label={t('labels.stock')} value={(() => {
                            const q = Number(item?.stockQuantity || 0)
                            if (item?.measurementType === 'WEIGHT') {
                                return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`
                            }
                            if (item?.measurementType === 'LENGTH') {
                                return `${q} m (${q * 100} cm)`
                            }
                            if (item?.measurementType === 'TIME') {
                                return `${q} h (${q * 60} min)`
                            }
                            return String(q)
                        })()} />
                        <InfoRow label={t('labels.unit')} value={item?.unit || (item?.measurementType === 'WEIGHT' ? 'kg (saved as g)' : 'pcs')} />
                        <InfoRow label={t('labels.measurement')} value={item?.measurementType || 'PCS'} />
                        <InfoRow label={t('labels.brand')} value={item?.brand || '—'} />
                        <InfoRow label={t('labels.size')} value={item?.size || '—'} />
                        <InfoRow label={t('labels.color')} value={item?.color ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="inline-block size-3 rounded" style={{ backgroundColor: item.color }} />
                                <span>{item.color}</span>
                            </span>
                        ) : '—'} />
                        <InfoRow label={t('labels.currency')} value={currency} />
                        <InfoRow label={t('labels.created')} value={item ? new Date(item.createdAt).toLocaleString() : '—'} />
                        <InfoRow label={t('labels.team')} value={<code className="text-[11px]">{item?.teamId || '—'}</code>} />
                        <InfoRow label={t('labels.id')} value={<code className="text-[11px]">{item?.id || '—'}</code>} />
                    </dl>
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.description')}</h3>
                    <div className="mt-2">
                        {item?.description ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.description}</p>
                        ) : (
                            <p className="text-sm text-gray-500 italic dark:text-gray-400">{t('drawer.noDescription')}</p>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.tags')}</h3>
                    {item?.tags && item.tags.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map(t => (
                                <li key={t} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10">{t}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500 italic dark:text-gray-400">{t('drawer.noTags')}</p>
                    )}
                </div>
            </div>
        </Drawer>
    )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between py-3 text-sm font-medium">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-gray-900 dark:text-white text-right">{value}</dd>
        </div>
    )
}

export default ItemInfoDrawer