'use client'
import { useTranslations, useLocale } from 'next-intl'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import FaqStructuredData from './FaqStructuredData'

export default function FAQ() {
  const t = useTranslations('Home.faq')
  const locale = useLocale()

  const faqs = [
    {
      question: t('q1.question'),
      answer: t('q1.answer'),
    },
    {
      question: t('q2.question'),
      answer: t('q2.answer'),
    },
    {
      question: t('q3.question'),
      answer: t('q3.answer'),
    },
    {
      question: t('q4.question'),
      answer: t('q4.answer'),
    },
    {
      question: t('q5.question'),
      answer: t('q5.answer'),
    },
    {
      question: t('q6.question'),
      answer: t('q6.answer'),
    },
    {
      question: t('q7.question'),
      answer: t('q7.answer'),
    },
  ]

  return (
    <div className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-950">
      <FaqStructuredData faqs={faqs} />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">
            {t('badge')}
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-6 text-xl text-gray-700 dark:text-gray-300">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ List */}
        <div className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <dl className="divide-y divide-gray-200 dark:divide-gray-800">
            {faqs.map((faq, index) => (
              <Disclosure key={index} as="div" className="py-6 first:pt-0 last:pb-0">
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <span className="ml-6 flex h-7 items-center">
                      <PlusSmallIcon
                        aria-hidden="true"
                        className="size-6 text-gray-500 transition-colors group-hover:text-indigo-600 group-data-open:hidden dark:text-gray-400 dark:group-hover:text-indigo-400"
                      />
                      <MinusSmallIcon
                        aria-hidden="true"
                        className="size-6 text-gray-500 transition-colors group-hover:text-indigo-600 group-not-data-open:hidden dark:text-gray-400 dark:group-hover:text-indigo-400"
                      />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-4 pr-12">
                  <p className="text-base text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </dl>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-16 max-w-2xl text-center sm:mt-20">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {t('stillHaveQuestions')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-x-6">
            <a
              href={`/${locale}/docs`}
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {t('viewDocs')}
            </a>
            <a
              href="mailto:support@ratiotuta.com"
              className="text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
            >
              {t('contactSupport')} <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
