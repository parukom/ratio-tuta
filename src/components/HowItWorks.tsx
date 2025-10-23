'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function HowItWorks() {
  const t = useTranslations('Home')

  return (
    <div id="features" className="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        {/* Header */}
        <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">
          {t('howItWorks.badge')}
        </h2>
        <p className="mt-2 max-w-lg text-4xl font-semibold tracking-tight text-pretty text-gray-950 sm:text-5xl dark:text-white">
          {t('howItWorks.title')}
        </p>

        {/* Bento Grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
          {/* Step 1: Signup - Large card (left top) */}
          <div className="relative lg:col-span-3">
            <div className="absolute inset-0 rounded-lg bg-white max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem] dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <Image
                alt={t('howItWorks.steps.signup.title')}
                src="/images/index/howitworks/1-signup.jpg"
                width={800}
                height={320}
                className="h-80 w-full object-cover object-center"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t('howItWorks.steps.signup.title')}
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  {t('howItWorks.steps.signup.description')}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  {t('howItWorks.steps.signup.detail1')}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm outline outline-1 outline-black/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem] dark:outline-white/15" />
          </div>

          {/* Step 2: Create Place - Large card (right top) */}
          <div className="relative lg:col-span-3">
            <div className="absolute inset-0 rounded-lg bg-white lg:rounded-tr-[2rem] dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
              <Image
                alt={t('howItWorks.steps.createPlace.title')}
                src="/images/index/howitworks/2-create-place.jpg"
                width={800}
                height={320}
                className="h-80 w-full object-cover object-center lg:object-right"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t('howItWorks.steps.createPlace.title')}
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  {t('howItWorks.steps.createPlace.description')}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  {t('howItWorks.steps.createPlace.detail1')}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm outline outline-1 outline-black/5 lg:rounded-tr-[2rem] dark:outline-white/15" />
          </div>

          {/* Step 3: Add Items - Medium card (left bottom) */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white lg:rounded-bl-[2rem] dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
              <Image
                alt={t('howItWorks.steps.addItems.title')}
                src="/images/index/howitworks/3-add-items.jpg"
                width={600}
                height={320}
                className="h-80 w-full object-cover object-center"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t('howItWorks.steps.addItems.title')}
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  {t('howItWorks.steps.addItems.description')}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  {t('howItWorks.steps.addItems.detail1')}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm outline outline-1 outline-black/5 lg:rounded-bl-[2rem] dark:outline-white/15" />
          </div>

          {/* Step 4: Start Selling - Medium card (center bottom) */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <Image
                alt={t('howItWorks.steps.startSelling.title')}
                src="/images/index/howitworks/4-start-selling.jpg"
                width={600}
                height={320}
                className="h-80 w-full object-cover object-center"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t('howItWorks.steps.startSelling.title')}
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  {t('howItWorks.steps.startSelling.description')}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  {t('howItWorks.steps.startSelling.detail1')}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm outline outline-1 outline-black/5 dark:outline-white/15" />
          </div>

          {/* Step 5: Analytics - Medium card (right bottom) */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-br-[2rem] dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <Image
                alt={t('howItWorks.steps.analytics.title')}
                src="/images/index/howitworks/5-analytics.jpg"
                width={600}
                height={320}
                className="h-80 w-full object-cover object-center"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t('howItWorks.steps.analytics.title')}
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  {t('howItWorks.steps.analytics.description')}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  {t('howItWorks.steps.analytics.detail1')}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm outline outline-1 outline-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem] dark:outline-white/15" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center shadow-xl dark:from-indigo-600 dark:to-purple-700">
          <h3 className="text-2xl font-semibold text-white">
            {t('howItWorks.cta.title')}
          </h3>
          <p className="mt-3 text-base text-indigo-100">
            {t('howItWorks.cta.subtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/auth?form=signup"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('howItWorks.cta.button')}
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-base font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('howItWorks.cta.docs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
