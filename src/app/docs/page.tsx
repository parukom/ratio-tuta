'use client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FirstPagesHeader } from '@/components/FirstPagesHeader'
import { useEffect, useState } from 'react'
import {
  BookOpenIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  MapIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  CircleStackIcon,
  CloudIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

type SessionData = {
  userId: string;
  name: string;
  role: 'USER' | 'ADMIN';
} | null;

export default function DocsPage() {
  const t = useTranslations('Docs')
  const tUser = useTranslations('Docs.userGuide.sections')
  const tDev = useTranslations('Docs.developerGuide.sections')
  const [session, setSession] = useState<SessionData>(null)

  useEffect(() => {
    fetchSession()
  }, [])

  async function fetchSession() {
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setSession({
          userId: data.id,
          name: data.name,
          role: data.role
        })
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const categories = [
    {
      id: 'user',
      title: t('userGuide.title'),
      description: t('userGuide.description'),
      icon: BookOpenIcon,
      color: 'indigo',
      sections: [
        {
          id: 'gettingStarted',
          title: tUser('gettingStarted.title'),
          description: tUser('gettingStarted.description'),
          icon: RocketLaunchIcon,
        },
        {
          id: 'places',
          title: tUser('places.title'),
          description: tUser('places.description'),
          icon: MapIcon,
        },
        {
          id: 'inventory',
          title: tUser('inventory.title'),
          description: tUser('inventory.description'),
          icon: CubeIcon,
        },
        {
          id: 'cashRegister',
          title: tUser('cashRegister.title'),
          description: tUser('cashRegister.description'),
          icon: CreditCardIcon,
        },
        {
          id: 'reports',
          title: tUser('reports.title'),
          description: tUser('reports.description'),
          icon: ChartBarIcon,
        },
      ],
    },
    {
      id: 'developer',
      title: t('developerGuide.title'),
      description: t('developerGuide.description'),
      icon: CodeBracketIcon,
      color: 'emerald',
      sections: [
        {
          id: 'architecture',
          title: tDev('architecture.title'),
          description: tDev('architecture.description'),
          icon: WrenchScrewdriverIcon,
        },
        {
          id: 'database',
          title: tDev('database.title'),
          description: tDev('database.description'),
          icon: CircleStackIcon,
        },
        {
          id: 'api',
          title: tDev('api.title'),
          description: tDev('api.description'),
          icon: CloudIcon,
        },
        {
          id: 'security',
          title: tDev('security.title'),
          description: tDev('security.description'),
          icon: LockClosedIcon,
        },
        {
          id: 'deployment',
          title: tDev('deployment.title'),
          description: tDev('deployment.description'),
          icon: CloudIcon,
        },
      ],
    },
    {
      id: 'security',
      title: t('security.title'),
      description: t('security.description'),
      icon: ShieldCheckIcon,
      color: 'rose',
      sections: [],
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FirstPagesHeader session={session} />

      <div className="relative isolate px-6 pt-24 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Main Categories */}
          <div className="mt-16 grid gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10"
              >
                <div className="flex items-center gap-x-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${category.color}-600`}
                  >
                    <category.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {category.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Sections Grid */}
                {category.sections.length > 0 && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {category.sections.map((section) => (
                      <Link
                        key={section.id}
                        href={`/docs/${category.id}#${section.id}`}
                        className="group relative rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-x-3">
                          <section.icon
                            className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                            aria-hidden="true"
                          />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {section.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Security Content (no subsections) */}
                {category.id === 'security' && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-6">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300">
                          {t('security.content.intro')}
                        </p>
                        <ul className="mt-4 space-y-2">
                          <li className="text-gray-700 dark:text-gray-300">
                            <strong>Encryption:</strong> {t('security.content.encryption')}
                          </li>
                          <li className="text-gray-700 dark:text-gray-300">
                            <strong>Access Control:</strong> {t('security.content.access')}
                          </li>
                          <li className="text-gray-700 dark:text-gray-300">
                            <strong>Audit Trail:</strong> {t('security.content.audit')}
                          </li>
                          <li className="text-gray-700 dark:text-gray-300">
                            <strong>Compliance:</strong> {t('security.content.compliance')}
                          </li>
                          <li className="text-gray-700 dark:text-gray-300">
                            <strong>Security Score:</strong> {t('security.content.score')}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-16 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 p-8">
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              {t('quickLinks')}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Link
                href="/auth"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('getStarted')}
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('viewPricing')}
              </Link>
              <a
                href="https://github.com/anthropics/ratio-tuta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('githubRepository')}
              </a>
              <Link
                href="/dashboard/home"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('dashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
