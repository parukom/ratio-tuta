'use client'

// Using native <img> to avoid Next.js remote image domain requirements
import { ItemRow, Group } from './types'
import { useTranslations } from 'next-intl'
import Drawer from '@/components/ui/Drawer'
import { formatQuantity } from './format'

type Props = {
    open: boolean
    onClose: () => void
    item: ItemRow | null
    group?: Group | null
}

const fmtCurrency = (v: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(v)

const ItemInfoDrawer = ({ open, onClose, item, group }: Props) => {
    const t = useTranslations('Items')

    // If we have a group, use group data; otherwise use item data
    const isGroup = !!group
    const displayItem = isGroup ? group!.items[0] : item
    const currency = displayItem?.currency || 'EUR'
    const imageSrc = isGroup ? (group!.imageUrl || '/images/no-image.jpg') : (item?.imageUrl || '/images/no-image.jpg')
    const title = isGroup ? group!.label : (item?.name || t('drawer.info'))
    const categoryName = isGroup ? group!.categoryName : item?.categoryName

    // For groups, calculate total stock
    const totalStock = isGroup ? group!.totalStock : (item?.stockQuantity ?? 0)

    return (
        <Drawer open={open} onClose={onClose} side="right" title={title} widthClassName="w-screen max-w-lg">
            <div className="space-y-6">
                {/* Header image and meta */}
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt={title}
                        src={imageSrc}
                        className="block aspect-10/7 w-full rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                    />
                    <div className="mt-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{categoryName || t('forms.noCategory')}</p>
                    </div>
                </div>

                {/* Variants section (only for groups with multiple items) */}
                {isGroup && group!.items.length > 1 && (
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.variants')}</h3>
                        <div className="mt-2 space-y-2">
                            {group!.items.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        {variant.size && (
                                            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900/50 dark:text-gray-200 dark:ring-white/10">
                                                {variant.size}
                                            </span>
                                        )}
                                        {variant.color && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="inline-block size-3 rounded ring-1 ring-gray-200 dark:ring-white/10" style={{ backgroundColor: variant.color }} />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{variant.color}</span>
                                            </span>
                                        )}
                                        {!variant.size && !variant.color && (
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{variant.name}</span>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatQuantity(
                                            variant.stockQuantity ?? 0,
                                            variant.measurementType,
                                            variant.unit,
                                            { pcs: t('units.pcsShort') }
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Information */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.info')}</h3>
                    <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
                        <InfoRow label={t('labels.status')} value={displayItem?.isActive ? t('labels.active') : t('labels.inactive')} />
                        {!isGroup && <InfoRow label={t('labels.sku')} value={item?.sku || '—'} />}
                        <InfoRow label={t('labels.price')} value={isGroup ? fmtCurrency(group!.price, currency) : (item ? fmtCurrency(item.price, currency) : '—')} />
                        {typeof (isGroup ? group!.pricePaid : item?.pricePaid) === 'number' && (
                            <InfoRow label={t('labels.cost')} value={fmtCurrency((isGroup ? group!.pricePaid : item!.pricePaid)!, currency)} />
                        )}
                        {typeof (isGroup ? group!.pricePaid : item?.pricePaid) === 'number' && (
                            <InfoRow label={t('labels.profit')} value={fmtCurrency((isGroup ? (group!.price - (group!.pricePaid || 0)) : (item!.price - (item!.pricePaid || 0))), currency)} />
                        )}
                        <InfoRow label={t('labels.tax')} value={isGroup ? `${(group!.taxRateBps / 100).toFixed(2)}%` : (item ? `${(item.taxRateBps / 100).toFixed(2)}%` : '—')} />
                        <InfoRow label={t('labels.stock')} value={(() => {
                            const q = Number(totalStock)
                            const mt = displayItem?.measurementType
                            if (mt === 'WEIGHT') {
                                return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`
                            }
                            if (mt === 'LENGTH') {
                                return q >= 100 ? `${(q / 100).toFixed(2)} m` : `${q} cm`
                            }
                            if (mt === 'VOLUME') {
                                return q >= 1000 ? `${(q / 1000).toFixed(2)} l` : `${q} ml`
                            }
                            if (mt === 'AREA') {
                                return q >= 10000 ? `${(q / 10000).toFixed(2)} m²` : `${q} cm²`
                            }
                            return String(q)
                        })()} />
                        <InfoRow label={t('labels.unit')} value={displayItem?.unit || (displayItem?.measurementType === 'WEIGHT' ? 'kg (saved as g)' : 'pcs')} />
                        <InfoRow label={t('labels.measurement')} value={displayItem?.measurementType || 'PCS'} />
                        <InfoRow label={t('labels.brand')} value={(isGroup ? group!.brand : item?.brand) || '—'} />
                        {!isGroup && <InfoRow label={t('labels.size')} value={item?.size || '—'} />}
                        {!isGroup && <InfoRow label={t('labels.color')} value={item?.color ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="inline-block size-3 rounded" style={{ backgroundColor: item.color }} />
                                <span>{item.color}</span>
                            </span>
                        ) : '—'} />}
                        {isGroup && group!.color && (
                            <InfoRow label={t('labels.color')} value={
                                <span className="inline-flex items-center gap-2">
                                    <span className="inline-block size-3 rounded" style={{ backgroundColor: group!.color }} />
                                    <span>{group!.color}</span>
                                </span>
                            } />
                        )}
                        <InfoRow label={t('labels.currency')} value={currency} />
                        {!isGroup && <InfoRow label={t('labels.created')} value={item ? new Date(item.createdAt).toLocaleString() : '—'} />}
                        {!isGroup && <InfoRow label={t('labels.team')} value={<code className="text-[11px]">{item?.teamId || '—'}</code>} />}
                        {!isGroup && <InfoRow label={t('labels.id')} value={<code className="text-[11px]">{item?.id || '—'}</code>} />}
                    </dl>
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.description')}</h3>
                    <div className="mt-2">
                        {displayItem?.description ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{displayItem.description}</p>
                        ) : (
                            <p className="text-sm text-gray-500 italic dark:text-gray-400">{t('drawer.noDescription')}</p>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('drawer.tags')}</h3>
                    {displayItem?.tags && displayItem.tags.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                            {displayItem.tags.map(tag => (
                                <li key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10">{tag}</li>
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