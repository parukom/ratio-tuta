"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

type DropdownItem = {
    key: string
    label: string
    href?: string
    onSelect?: (key: string) => void
}

type Props = {
    buttonLabel?: string
    items?: DropdownItem[]
    onSelect?: (key: string) => void
    align?: 'left' | 'right'
    disabled?: boolean
}

export default function Dropdown({
    buttonLabel = 'Options',
    items,
    onSelect,
    align = 'right',
    disabled = false,
}: Props) {
    const menuAlign = align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'

    const defaultItems: DropdownItem[] = [
        { key: 'account', label: 'Account settings' },
        { key: 'support', label: 'Support' },
        { key: 'license', label: 'License' },
        { key: 'signout', label: 'Sign out' },
    ]

    const list = items && items.length > 0 ? items : defaultItems

    function handleSelect(item: DropdownItem) {
        item.onSelect?.(item.key)
        onSelect?.(item.key)
    }

    return (
        <Menu as="div" className="relative inline-block">
            <MenuButton
                disabled={disabled}
                className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
            >
                {buttonLabel}
                <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
            </MenuButton>

            <MenuItems
                transition
                className={`absolute ${menuAlign} z-10 mt-2 w-56 rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10`}
            >
                <div className="py-1">
                    {list.map((item) => (
                        <MenuItem key={item.key}>
                            {item.href ? (
                                <a
                                    href={item.href}
                                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                                >
                                    {item.label}
                                </button>
                            )}
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    )
}
