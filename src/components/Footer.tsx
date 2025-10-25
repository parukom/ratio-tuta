'use client'
import { SVGProps } from "react"
import { useTranslations } from 'next-intl'
import Logo from "./ui/Logo"

export default function Footer() {
  const t = useTranslations('Footer')

  const navigation = {
    product: [
      { name: t('product.features'), href: '/#features' },
      { name: t('product.howItWorks'), href: '/#how-it-works' },
      { name: t('product.pricing'), href: '/pricing' },
      { name: t('product.docs'), href: '/docs' },
    ],
    support: [
      { name: t('support.userGuide'), href: '/docs/user' },
      { name: t('support.developerDocs'), href: '/docs/developer' },
      { name: t('support.contact'), href: 'mailto:support@ratiotuta.com' },
    ],
    legal: [
      { name: t('legal.privacy'), href: '/privacy' },
      { name: t('legal.terms'), href: '/terms' },
    ],
    social: [
      {
        name: 'GitHub',
        href: 'https://github.com',
        icon: (props: SVGProps<SVGSVGElement>) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
    ],
  }

  return (
    <footer className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:py-24 ">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('tagline')}
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('product.title')}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('support.title')}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('legal.title')}</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-900/10 pt-8 md:flex md:items-center md:justify-between dark:border-white/10">
          <div className="flex gap-x-6 md:order-2">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon aria-hidden="true" className="size-6" />
              </a>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-600 md:order-1 md:mt-0 dark:text-gray-400">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  )
}
