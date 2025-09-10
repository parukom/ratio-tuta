'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  id?: string
  label?: React.ReactNode
  required?: boolean
  value?: File | null
  onChange: (file: File | null) => void
  hint?: string
  accept?: string
  allowCamera?: boolean
  disabled?: boolean
  maxSizeMB?: number
  className?: string
  initialUrl?: string | null
  onRemoveInitial?: () => void
  replaceLabel?: string
  removeLabel?: string
}

const ImageUploader = ({
  id,
  label,
  required,
  value,
  onChange,
  hint,
  accept = 'image/*',
  allowCamera = false,
  disabled = false,
  maxSizeMB = 10,
  className,
  initialUrl,
  onRemoveInitial,
  replaceLabel,
  removeLabel,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string>('')

  const filePreviewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value])
  const previewUrl = filePreviewUrl || null
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl])

  function pickFile() {
    if (disabled) return
    inputRef.current?.click()
  }

  function validateAndSet(file: File | null) {
    setError('')
    if (!file) { onChange(null); return }
    const isImage = file.type.startsWith('image/')
    if (!isImage) { setError('Unsupported file type'); return }
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) { setError(`File too large (max ${maxSizeMB}MB)`) ; return }
    onChange(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndSet(e.target.files?.[0] ?? null)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    validateAndSet(file ?? null)
  }

  function onDrag(e: React.DragEvent<HTMLDivElement>, over: boolean) {
    e.preventDefault(); e.stopPropagation(); if (!disabled) setDragOver(over)
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickFile() } }}
        onDragOver={(e) => onDrag(e, true)}
        onDragEnter={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={onDrop}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed p-4 transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10' : 'border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {previewUrl || initialUrl ? (
          <div className="relative w-full">
            <img src={previewUrl || initialUrl || ''} alt="Selected image preview" className="h-44 w-full rounded-md object-cover sm:h-56" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2">
              <div className="truncate text-xs text-white opacity-90">
                {value?.name || 'image'}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); pickFile() }} className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs hover:bg-white">
                  {replaceLabel || 'Replace'}
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); value ? onChange(null) : onRemoveInitial?.() }} className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/50 hover:bg-white/30">
                  {removeLabel || 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center gap-3 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6"><path d="M4 5a2 2 0 012-2h2.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0013.828 6H18a2 2 0 012 2v1h-2V8h-4.172a4 4 0 01-2.828-1.172L9.172 5H6v14h6v2H6a2 2 0 01-2-2V5z"/><path d="M16 20l.001-6H14l4-5 4 5h-2.001V20H16z"/></svg>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Click to upload or drag and drop</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP up to {maxSizeMB}MB</div>
            </div>
          </div>
        )}
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          capture={allowCamera ? 'environment' : undefined}
          className="hidden"
          disabled={disabled}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export default ImageUploader
