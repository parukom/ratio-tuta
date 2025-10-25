'use client'
import { useTranslations } from 'next-intl'
import {
  CubeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  BoltIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function Features() {
  const t = useTranslations('Home.features')

  const features = [
    {
      name: t('inventory.title'),
      description: t('inventory.description'),
      icon: CubeIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: t('multiLocation.title'),
      description: t('multiLocation.description'),
      icon: BuildingStorefrontIcon,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: t('analytics.title'),
      description: t('analytics.description'),
      icon: ChartBarIcon,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      name: t('team.title'),
      description: t('team.description'),
      icon: UsersIcon,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      name: t('mobile.title'),
      description: t('mobile.description'),
      icon: DevicePhoneMobileIcon,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      name: t('security.title'),
      description: t('security.description'),
      icon: ShieldCheckIcon,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      name: t('fast.title'),
      description: t('fast.description'),
      icon: BoltIcon,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      name: t('realtime.title'),
      description: t('realtime.description'),
      icon: ClockIcon,
      gradient: 'from-teal-500 to-cyan-500',
    },
  ]

  return (
    <div id="features" className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        {/* Header */}
        <div className="max-w-4xl">
          <p className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">
            {t('badge')}
          </p>
          <h2 className="mt-2 max-w-lg text-4xl font-semibold tracking-tight text-pretty text-gray-950 sm:text-5xl dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-6 text-xl/8 text-balance text-gray-700 dark:text-gray-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl hover:ring-indigo-500/50 dark:bg-gray-900 dark:ring-white/10 dark:hover:ring-indigo-500/50"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5 dark:group-hover:opacity-10 ${feature.gradient}`} />

              {/* Icon */}
              <div className={`relative inline-flex rounded-lg bg-gradient-to-br ${feature.gradient} p-3 shadow-lg ring-1 ring-white/20`}>
                <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>

              {/* Content */}
              <h3 className="relative mt-6 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="relative mt-2 text-sm/6 text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>

              {/* Decorative element */}
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20 dark:group-hover:opacity-10 ${feature.gradient}`} />
            </div>
          ))}
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-24 sm:mt-32">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
              {t('whyChooseUs.title')}
            </h3>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              {t('whyChooseUs.subtitle')}
            </p>
          </div>

          {/* Stats/Benefits Grid */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
            {/* No Hidden Fees */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 shadow-xl">
              <div className="relative">
                <h4 className="text-2xl font-semibold text-white">
                  {t('whyChooseUs.noFees.title')}
                </h4>
                <p className="mt-3 text-base text-indigo-100">
                  {t('whyChooseUs.noFees.description')}
                </p>
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* Easy Setup */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 shadow-xl">
              <div className="relative">
                <h4 className="text-2xl font-semibold text-white">
                  {t('whyChooseUs.easySetup.title')}
                </h4>
                <p className="mt-3 text-base text-green-100">
                  {t('whyChooseUs.easySetup.description')}
                </p>
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* 24/7 Support */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-8 shadow-xl sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <h4 className="text-2xl font-semibold text-white">
                  {t('whyChooseUs.support.title')}
                </h4>
                <p className="mt-3 text-base text-orange-100">
                  {t('whyChooseUs.support.description')}
                </p>
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
