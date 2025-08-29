import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import React from 'react'

const SearchInput = () => {
    return (
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form method="GET" className="grid flex-1 grid-cols-1">
                <input
                    name="search"
                    placeholder="Search"
                    aria-label="Search"
                    className="col-start-1 row-start-1 block size-full bg-transparent pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500"
                />
                <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400 dark:text-gray-500"
                />
            </form>
        </div>
    )
}

export default SearchInput
