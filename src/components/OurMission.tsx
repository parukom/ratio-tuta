'use client'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function OurMission() {
  const t = useTranslations('Home')

  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-900 px-4 lg:px-12">
      <div className="mx-auto max-w-2xl lg:max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">{t('mission.label')}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl dark:text-white">
            {t('mission.heading')}
          </h1>
          <p className="mt-6 text-xl/8 text-balance text-gray-700 dark:text-gray-300">
            {t('mission.description')}
          </p>
        </div>
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
          <div className="lg:pr-8">
            <h2 className="text-2xl font-semibold tracking-tight text-pretty text-gray-900 dark:text-white">
              {t('mission.sectionTitle')}
            </h2>
            <ul className="mt-6 space-y-4 text-base/7 text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-medium text-gray-900 dark:text-white">{t('mission.saveTime.title')}</span> {t('mission.saveTime.body')}
              </li>
              <li>
                <span className="font-medium text-gray-900 dark:text-white">{t('mission.saveMoney.title')}</span> {t('mission.saveMoney.body')}
              </li>
              <li>
                <span className="font-medium text-gray-900 dark:text-white">{t('mission.stayUpdated.title')}</span> {t('mission.stayUpdated.body')}
              </li>
              <li>
                <span className="font-medium text-gray-900 dark:text-white">{t('mission.beSecure.title')}</span> {t('mission.beSecure.body')}
              </li>
            </ul>
          </div>
          <div className="pt-16 lg:row-span-2 ">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 dark:shadow-none dark:outline-white/10">
                <Image
                  alt="Safe and secure transactions"
                  src="/images/index/hero/safe.jpg"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="relative -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 lg:-mt-40 dark:shadow-none dark:outline-white/10">
                <Image
                  alt="Save time with automation"
                  src="/images/index/hero/saveTime.jpg"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 dark:shadow-none dark:outline-white/10">
                <Image
                  alt="Stay updated with real-time data"
                  src="/images/index/hero/stayUpdated.jpg"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="relative -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 lg:-mt-40 dark:shadow-none dark:outline-white/10">
                <Image
                  alt="Secure data protection"
                  src="/images/index/hero/secure.jpg"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <p className="text-base/7 font-semibold text-gray-500 dark:text-gray-400">{t('mission.whatYouGet')}</p>
            <hr className="mt-6 border-t border-gray-200 dark:border-gray-700" />
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4 dark:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">{t('mission.features.timeBack.title')}</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {t('mission.features.timeBack.desc')}
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4 dark:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">{t('mission.features.lowerCosts.title')}</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {t('mission.features.lowerCosts.desc')}
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:border-gray-200 max-sm:pb-4 dark:max-sm:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">{t('mission.features.liveVisibility.title')}</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {t('mission.features.liveVisibility.desc')}
                </dd>
              </div>
              <div className="flex flex-col gap-y-2">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">{t('mission.features.security.title')}</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {t('mission.features.security.desc')}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}

