import Link from 'next/link'
import DeletePlaceButton from './DeletePlaceButton'
import { MapPinIcon, BoltIcon, ClockIcon, UsersIcon, BanknotesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

type Props = {
  id?: string
  name: string
  description?: string | null
  city?: string | null
  country?: string | null
  isActive?: boolean
  currency?: string | null
  totalEarnings: number
  teamPeopleCount: number
  // Aggregates
  itemsCount?: number
  stockUnits?: number
  receiptsToday?: number
  salesToday?: number
  receipts7d?: number
  lastActivityAt?: string | null
  onDelete?: (id: string) => void
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export default function PlaceCard({
  id,
  name,
  description,
  city,
  country,
  isActive = true,
  currency = 'EUR',
  totalEarnings,
  teamPeopleCount,
  receiptsToday = 0,
  salesToday = 0,
  receipts7d = 0,
  lastActivityAt,
  onDelete,
}: Props) {
  const href = id ? `/dashboard/home/place/${id}` : '#'
  const statusColor = isActive
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-300/20'
    : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-300/20'
  const location = [city, country].filter(Boolean).join(', ')
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR' }).format(n)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-white/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{description || '—'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
                <MapPinIcon className="h-3 w-3" /> {location}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${statusColor}`}>
              <BoltIcon className="h-3 w-3" /> {isActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
          <div className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{fmt(salesToday)}</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">{receiptsToday} receipts</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 flex gap-2">
        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-white/5 flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
            <BanknotesIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {fmt(totalEarnings)}
          </div>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-white/5 flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
            <ClipboardDocumentListIcon className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {receipts7d}
          </div>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-white/5 flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
            <UsersIcon className="h-4 w-4 text-pink-500" />
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {teamPeopleCount}
          </div>
        </div>
      </div>


      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" /> Last activity: {timeAgo(lastActivityAt)}
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <DeletePlaceButton placeId={id} placeName={name} onDeleted={() => onDelete?.(id)} />
          )}
          <Link
            href={href}
            className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-gray-900 dark:hover:bg-white/90"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  )
}
