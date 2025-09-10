import type { ReactNode } from 'react'

type Props = {
    title?: string
    subtitle?: string
    onAdd?: () => void
    addLabel?: string
    left?: ReactNode
    right?: ReactNode
}

const AdminHeader = ({ title, subtitle, onAdd, addLabel = 'Add', left, right }: Props) => {
    return (
        <div className="flex justify-between gap-4 w-full">

            {/* left */}
            <div className="sm:flex-auto w-full">
                {left ? (
                    left
                ) : (
                    <>
                        {title ? (
                            <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
                        ) : null}
                        {subtitle ? (
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{subtitle}</p>
                        ) : null}
                    </>
                )}
            </div>

            {/* right */}
            <div className="sm:flex-nowrap">
                {right ? (
                    right
                ) : onAdd ? (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {addLabel}
                    </button>
                ) : null}
            </div>

        </div>
    )
}

export default AdminHeader;