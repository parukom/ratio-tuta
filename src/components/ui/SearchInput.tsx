import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import React from 'react'
import { useTranslations } from 'next-intl'

type Props = {
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    name?: string
    containerClassName?: string
    inputClassName?: string
    showIcon?: boolean
}

const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search',
    name = 'search',
    containerClassName = 'flex flex-1 gap-x-4 self-stretch lg:gap-x-6',
    inputClassName = 'col-start-1 row-start-1 block size-full bg-transparent pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500',
    showIcon = true,
}: Props) => {
    const t = useTranslations('Common')
    const controlled = typeof onChange === 'function'
    return (
        <div className={containerClassName}>
            <div className="grid flex-1 grid-cols-1 relative">
                <input
                    name={name}
                    placeholder={placeholder}
                    aria-label={t('search', { default: 'Search' })}
                    className={inputClassName}
                    {...(controlled ? { value, onChange } : {})}
                />
                {showIcon && (
                    <MagnifyingGlassIcon
                        aria-hidden="true"
                        className="absolute left-1.5 pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400 dark:text-gray-500"
                    />
                )}
            </div>
        </div>
    )
}

export default SearchInput
