'use client'

import React from 'react'
import { Switch } from '@headlessui/react'
import { useTranslations } from 'next-intl'
import { useHelp } from '@/hooks/useHelp'

export const HelpPreference: React.FC = () => {
    const t = useTranslations('Settings.help')
    const { showHelp, toggleHelp, loading } = useHelp()

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>
            <div className="md:col-span-2">
                <Switch.Group>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={showHelp}
                            onChange={toggleHelp}
                            disabled={loading}
                            className={`${
                                showHelp ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:focus:outline-indigo-500`}
                        >
                            <span
                                className={`${
                                    showHelp ? 'translate-x-6' : 'translate-x-1'
                                } inline-block size-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                        <Switch.Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                            {showHelp ? t('enabled') : t('disabled')}
                        </Switch.Label>
                    </div>
                </Switch.Group>
                <p className="mt-2 text-xs/5 text-gray-500 dark:text-gray-400">{t('note')}</p>
            </div>
        </div>
    )
}

export default HelpPreference
