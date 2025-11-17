'use client'

import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BellAlertIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  XCircleIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'

export default function TermsAndConditions() {
  const t = useTranslations('Terms')

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16 lg:py-24 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        {/* Header */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 sm:mb-6">
            <DocumentTextIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl dark:text-white px-2">
            {t('title')}
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2">
            {t('lastUpdated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Welcome Banner */}
        <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">{t('welcome.title')}</h2>
          <p className="text-base sm:text-lg text-indigo-50">
            {t('welcome.description')}
          </p>
        </div>

        {/* Content Sections */}
        <div className="mt-8 sm:mt-10 lg:mt-12 space-y-6 sm:space-y-8">

          {/* Acceptance of Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('acceptance.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('acceptance.description')}
            </p>
          </section>

          {/* Description of Service */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentDuplicateIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('service.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              {t('service.intro')}
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('service.items.inventory')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('service.items.sales')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('service.items.multiLocation')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('service.items.team')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('service.items.analytics')}</span>
              </li>
            </ul>
          </section>

          {/* User Accounts */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <UserCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('accounts.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              {t('accounts.intro')}
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('accounts.items.confidentiality')}</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('accounts.items.activities')}</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('accounts.items.unauthorized')}</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('accounts.items.accuracy')}</span>
              </div>
            </div>
          </section>

          {/* Privacy and Data Ownership */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ShieldCheckIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('privacy.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              <strong>{t('privacy.intro')}</strong>
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('privacy.items.noSell')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('privacy.items.noAnalyze')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('privacy.items.export')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {t('privacy.items.seePolicy')} <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold underline">Privacy Policy</Link>
                </span>
              </li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('acceptable.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">{t('acceptable.intro')}</p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.illegal')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.laws')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.intellectual')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.malware')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.unauthorized')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('acceptable.items.interfere')}</span>
              </li>
            </ul>
          </section>

          {/* Service Availability */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('availability.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              {t('availability.intro')}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('availability.items.uptime')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('availability.items.maintenance')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('availability.items.notify')}</p>
              </div>
            </div>
          </section>

          {/* Pricing and Payment */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <CurrencyDollarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('pricing.title')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('pricing.items.free')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('pricing.items.paid')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('pricing.items.transparent')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('pricing.items.cancel')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 sm:col-span-2">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('pricing.items.refunds')}</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-pink-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('intellectual.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('intellectual.description')}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('liability.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('liability.description')}
            </p>
          </section>

          {/* Termination */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('termination.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('termination.description')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('changes.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('changes.description')}
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('governing.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('governing.description')}
            </p>
          </section>

          {/* Contact Us */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <EnvelopeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('contact.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              {t('contact.description')}
            </p>
            <a
              href="mailto:tomasdudovicius@gmail.com"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('contact.email')}
            </a>
          </section>

          {/* Entire Agreement */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentDuplicateIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-teal-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('entire.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('entire.description')}
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
