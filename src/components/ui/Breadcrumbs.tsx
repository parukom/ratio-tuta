import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'
import { useTranslations } from 'next-intl'

export type BreadcrumbItem = {
  name: string
  href?: string
}

export default function Breadcrumbs({
  items,
  homeHref = '/dashboard/home',
}: {
  items: BreadcrumbItem[]
  homeHref?: string
}) {
  const t = useTranslations('Common')
  return (
    <nav aria-label="Breadcrumb" className="flex ">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Link href={homeHref} className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
              <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
              <span className="sr-only">{t('home', { default: 'Home' })}</span>
            </Link>
          </div>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          const ariaCurrent = isLast ? 'page' : undefined
          return (
            <li key={item.name}>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400 dark:text-gray-500" />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    aria-current={ariaCurrent}
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span
                    aria-current={ariaCurrent}
                    className="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {item.name}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
