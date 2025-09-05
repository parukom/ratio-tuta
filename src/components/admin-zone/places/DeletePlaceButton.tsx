'use client'

import { useState } from 'react'
import Modal from '@/components/modals/Modal'

type Props = {
  placeId: string
  placeName: string
  onDeleted?: (placeId: string) => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export default function DeletePlaceButton({ placeId, placeName, onDeleted, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const disabled = confirmName.trim() !== placeName || loading

  const doDelete = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/places/${placeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to delete place')
      }
      onDeleted?.(placeId)
      // notify sidebar/layout to refresh places list
      try { window.dispatchEvent(new Event('places:changed')) } catch { /* noop */ }
      setOpen(false)
      setConfirmName('')
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
      >
        Delete
      </button>

      <Modal open={open} onClose={() => { if (!loading) { setOpen(false); setConfirmName(''); setError(null) } }} size={size}>
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-500/10">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div className="mt-3 text-left sm:ml-4 sm:mt-0">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Delete place</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. To confirm, type the name of the place exactly: <span className="font-semibold">{placeName}</span>
              </p>
              <div className="mt-2 flex flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(placeName)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1200)
                    } catch {
                      // ignore
                    }
                  }}
                  className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {copied ? 'Copied' : 'Copy name'}
                </button>
              </div>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={placeName}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            disabled={disabled}
            onClick={doDelete}
            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto ${disabled ? 'bg-red-400/50 text-white/70 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-500'}`}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  )
}
