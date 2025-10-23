'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  UserPlusIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function HowItWorks() {
  const t = useTranslations('Home')

  const steps = [
    {
      number: '01',
      title: t('howItWorks.steps.signup.title'),
      description: t('howItWorks.steps.signup.description'),
      icon: UserPlusIcon,
      color: 'indigo',
      details: [
        t('howItWorks.steps.signup.detail1'),
        t('howItWorks.steps.signup.detail2'),
        t('howItWorks.steps.signup.detail3'),
      ],
    },
    {
      number: '02',
      title: t('howItWorks.steps.createPlace.title'),
      description: t('howItWorks.steps.createPlace.description'),
      icon: BuildingStorefrontIcon,
      color: 'emerald',
      details: [
        t('howItWorks.steps.createPlace.detail1'),
        t('howItWorks.steps.createPlace.detail2'),
        t('howItWorks.steps.createPlace.detail3'),
      ],
    },
    {
      number: '03',
      title: t('howItWorks.steps.addItems.title'),
      description: t('howItWorks.steps.addItems.description'),
      icon: CubeIcon,
      color: 'blue',
      details: [
        t('howItWorks.steps.addItems.detail1'),
        t('howItWorks.steps.addItems.detail2'),
        t('howItWorks.steps.addItems.detail3'),
      ],
    },
    {
      number: '04',
      title: t('howItWorks.steps.startSelling.title'),
      description: t('howItWorks.steps.startSelling.description'),
      icon: CreditCardIcon,
      color: 'purple',
      details: [
        t('howItWorks.steps.startSelling.detail1'),
        t('howItWorks.steps.startSelling.detail2'),
        t('howItWorks.steps.startSelling.detail3'),
      ],
    },
    {
      number: '05',
      title: t('howItWorks.steps.analytics.title'),
      description: t('howItWorks.steps.analytics.description'),
      icon: ChartBarIcon,
      color: 'rose',
      details: [
        t('howItWorks.steps.analytics.detail1'),
        t('howItWorks.steps.analytics.detail2'),
        t('howItWorks.steps.analytics.detail3'),
      ],
    },
  ]

  return (
    <div id="features" className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">
            {t('howItWorks.badge')}
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl dark:text-white">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-6 text-lg/8 text-balance text-gray-600 dark:text-gray-300">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex flex-col gap-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-white/10 lg:flex-row lg:gap-12"
              >
                {/* Step Number & Icon */}
                <div className="flex flex-col items-center lg:items-start lg:w-48 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-bold text-gray-200 dark:text-gray-700">
                      {step.number}
                    </span>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-${step.color}-600 dark:bg-${step.color}-500`}>
                      <step.icon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base/7 text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>

                  {/* Details List */}
                  <ul className="mt-6 space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-3">
                        <CheckCircleIcon className={`h-6 w-6 flex-shrink-0 text-${step.color}-600 dark:text-${step.color}-400`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Connecting Line (for visual flow between steps) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 -bottom-6 hidden h-12 w-0.5 bg-gradient-to-b from-gray-200 to-transparent lg:block dark:from-gray-700" />
                )}
              </div>
            ))}
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
