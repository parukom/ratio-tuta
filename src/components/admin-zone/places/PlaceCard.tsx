import Link from 'next/link'
import DeletePlaceButton from './DeletePlaceButton'

type Props = {
  name: string
  description?: string | null
  totalEarnings: number
  teamPeopleCount: number
  currency?: string | null
  id?: string
  onDelete?: (id: string) => void
}

export default function PlaceCard({ id, name, description, totalEarnings, teamPeopleCount, currency = 'EUR', onDelete }: Props) {
  return (
    <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-md dark:bg-white/5 dark:ring-white/10">
      <Link href={id ? `/dashboard/home/place/${id}` : '#'} className="block border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5 rounded-lg">
        <p className="text-sm/6 font-medium text-gray-900 dark:text-white">{name}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 line-clamp-2">{description || '—'}</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total earnings</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR' }).format(totalEarnings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">People in company</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{teamPeopleCount}</p>
          </div>
        </div>
      </Link>
      {id && (
        <div className="px-4 pb-4 sm:px-6 lg:px-8">
          <div className="mt-2 flex justify-end">
            <DeletePlaceButton placeId={id} placeName={name} onDeleted={() => onDelete?.(id)} />
          </div>
        </div>
      )}
    </div>
  )
}
