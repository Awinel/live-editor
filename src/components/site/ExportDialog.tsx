'use client'

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type { ExportResponse } from '@/lib/exportActions'
import type { ExportFile, ExportFormat } from '@/puck/export'

const FORMATS: Array<{ value: ExportFormat; label: string; note: string }> = [
  {
    value: 'html',
    label: 'HTML + CSS',
    note: 'Plain HTML with a stylesheet. Base classes keep readable names, and styles you set get their own lc-n classes.',
  },
  {
    value: 'tailwind',
    label: 'Tailwind',
    note: 'JSX with Tailwind utility classes (className, and images and inputs closed), for Tailwind v4 or v3.3 and newer. Animations add a small keyframes file for your global CSS. The full page loads the Tailwind browser build so it previews on its own.',
  },
]

type ExportDialogProps = {
  load: (format: ExportFormat) => Promise<ExportResponse>
  renderTrigger: (open: () => void) => ReactNode
  sourceNote: string
}

export function ExportDialog({ load, renderTrigger, sourceNote }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('html')
  const [result, setResult] = useState<ExportResponse | null>(null)
  const [fileId, setFileId] = useState<ExportFile['id']>('snippet')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => setMounted(true), [])

  const requestRef = useRef(0)

  const fetchFormat = (next: ExportFormat) =>
    startTransition(async () => {
      const request = ++requestRef.current
      setNotice('')
      const response = await load(next).catch(() => ({ ok: false as const, message: 'Export failed. Try again.' }))
      if (request !== requestRef.current) return
      setResult(response)
      if (response.ok && !response.files.some((file) => file.id === fileId)) setFileId('snippet')
    })

  const open = () => {
    dialogRef.current?.showModal()
    fetchFormat(format)
  }

  const files = result?.ok ? result.files : []
  const file = files.find((item) => item.id === fileId) ?? files[0]
  const note = FORMATS.find((item) => item.value === format)?.note

  const copy = async () => {
    if (!file) return
    try {
      await navigator.clipboard.writeText(file.content)
      setNotice(`Copied ${file.filename}`)
    } catch {
      setNotice('Copying is blocked here. Select the code and copy it instead.')
    }
  }

  const download = () => {
    if (!file) return
    const url = URL.createObjectURL(new Blob([file.content], { type: `${file.mime};charset=utf-8` }))
    const link = document.createElement('a')
    link.href = url
    link.download = file.filename
    link.click()
    URL.revokeObjectURL(url)
    setNotice(`Downloaded ${file.filename}`)
  }

  const dialog = (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto w-[min(60rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-lg border border-rule bg-paper p-0 font-sans text-teal shadow-2xl backdrop:bg-teal/45"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl font-bold tracking-tight text-violet">
              Export component
            </h2>
            <p className="mt-1 text-sm text-muted">{sourceNote}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary min-h-10 px-4"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div role="radiogroup" aria-label="Format" className="flex w-fit rounded-md border-2 border-teal p-0.5">
            {FORMATS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={format === item.value}
                className={`min-h-10 rounded px-4 text-sm font-semibold transition-colors ${
                  format === item.value ? 'bg-teal text-paper' : 'text-teal hover:bg-teal/10'
                }`}
                onClick={() => {
                  setFormat(item.value)
                  fetchFormat(item.value)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="max-w-3xl text-sm text-muted">{note}</p>
        </div>

        {result && !result.ok ? (
          <p role="alert" className="rounded-md border-l-4 border-crimson bg-crimson/5 px-4 py-3 font-semibold text-crimson">
            {result.message}
          </p>
        ) : (
          <div className="flex min-h-0 flex-col gap-3">
            <div role="tablist" aria-label="Files" className="flex flex-wrap gap-x-5 gap-y-1 border-b border-rule">
              {files.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === file?.id}
                  className={`-mb-px border-b-[3px] pb-2 text-sm font-semibold ${
                    item.id === file?.id ? 'border-orange text-violet' : 'border-transparent text-muted hover:text-teal'
                  }`}
                  onClick={() => setFileId(item.id)}
                >
                  {item.label}
                  <span className="ml-2 hidden font-normal text-muted sm:inline">{item.filename}</span>
                </button>
              ))}
            </div>
            <pre
              role="tabpanel"
              tabIndex={0}
              aria-busy={pending}
              aria-label={file ? `${file.filename} source` : 'Export source'}
              className={`max-h-[36vh] min-h-48 sm:max-h-[48vh] overflow-auto rounded-md bg-teal p-4 font-mono text-[13px] leading-relaxed text-paper transition-opacity ${
                pending ? 'opacity-60' : ''
              }`}
            >
              <code>{file?.content ?? (pending ? 'Generating…' : '')}</code>
            </pre>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" onClick={copy} disabled={!file || pending}>
                Copy code
              </button>
              <button type="button" className="btn btn-secondary" onClick={download} disabled={!file || pending}>
                Download file
              </button>
              <span role="status" className="text-sm font-semibold text-teal">
                {notice}
              </span>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )

  return (
    <>
      {renderTrigger(open)}
      {mounted && createPortal(dialog, document.body)}
    </>
  )
}
