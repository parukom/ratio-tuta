type Props = {
  name: string
  description?: string | null
  totalEarnings: number
  teamPeopleCount: number
  currency?: string | null
}

export default function PlaceCard({ name, description, totalEarnings, teamPeopleCount, currency = 'EUR' }: Props) {
  return (
    <div className="border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5 rounded-lg bg-white dark:bg-white/5 shadow-sm">
      <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{name}</p>
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
    </div>
  )
}
