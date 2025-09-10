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
        <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
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
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
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