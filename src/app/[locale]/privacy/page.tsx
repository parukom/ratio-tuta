'use client'

import Link from 'next/link'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  XCircleIcon,
  DocumentTextIcon,
  LockClosedIcon,
  TrashIcon,
  GlobeAltIcon,
  ScaleIcon,
  EnvelopeIcon,
  BellAlertIcon,
  CakeIcon
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'

export default function PrivacyPolicy() {
  const t = useTranslations('Privacy')

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
            <ShieldCheckIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl dark:text-white px-2">
            {t('title')}
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2">
            {t('lastUpdated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Commitment Banner */}
        <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">{t('commitment.title')}</h2>
          <p className="text-base sm:text-lg text-indigo-50">
            {t('commitment.description')}
            <span className="block mt-2 text-lg sm:text-xl font-semibold text-white">
              {t('commitment.principle')}
            </span>
          </p>
        </div>

        {/* Content Sections */}
        <div className="mt-8 sm:mt-10 lg:mt-12 space-y-6 sm:space-y-8">

          {/* What We Don't Do */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('whatWeDont.title')}</h2>
            </div>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.read')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.track')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.analyze')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.sell')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.advertise')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('whatWeDont.items.care')}</span>
              </li>
            </ul>
          </section>

          {/* What Data We Collect */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('whatWeCollect.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              {t('whatWeCollect.intro')}
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{t('whatWeCollect.account.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t('whatWeCollect.account.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{t('whatWeCollect.business.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t('whatWeCollect.business.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{t('whatWeCollect.technical.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t('whatWeCollect.technical.description')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies We Use */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <CakeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-amber-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('cookies.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              {t('cookies.intro')}
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{t('cookies.session.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Name:</span> {t('cookies.session.name')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    <span className="font-medium">Purpose:</span> {t('cookies.session.purpose')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    <span className="font-medium">Duration:</span> {t('cookies.session.duration')}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                    {t('cookies.session.type')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{t('cookies.locale.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Name:</span> {t('cookies.locale.name')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    <span className="font-medium">Purpose:</span> {t('cookies.locale.purpose')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    <span className="font-medium">Duration:</span> {t('cookies.locale.duration')}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                    {t('cookies.locale.type')}
                  </p>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">{t('cookies.noTracking.title')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t('cookies.noTracking.description')}
                </p>
              </div>
            </div>
          </section>

          {/* How We Protect Your Data */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <LockClosedIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('howWeProtect.title')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">{t('howWeProtect.encryption.title')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('howWeProtect.encryption.description')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">{t('howWeProtect.access.title')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('howWeProtect.access.description')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">{t('howWeProtect.infrastructure.title')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('howWeProtect.infrastructure.description')}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">{t('howWeProtect.audits.title')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('howWeProtect.audits.description')}</p>
              </div>
            </div>
          </section>

          {/* Data Retention and Deletion */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <TrashIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('retention.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              {t('retention.intro')}
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('retention.export')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('retention.delete')}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('retention.request')}</span>
              </li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <GlobeAltIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('thirdParty.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('thirdParty.description')}
            </p>
          </section>

          {/* Your Rights */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('yourRights.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              {t('yourRights.intro')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('yourRights.access')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('yourRights.correct')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('yourRights.requestDeletion')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('yourRights.exportData')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:col-span-2">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{t('yourRights.object')}</span>
              </div>
            </div>
          </section>

          {/* Contact Us */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <EnvelopeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-pink-500 flex-shrink-0" />
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

          {/* Changes to This Policy */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('changes.title')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {t('changes.description')}
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
