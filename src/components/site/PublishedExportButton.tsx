'use client'

import { exportPublished } from '@/lib/exportActions'

import { ExportDialog } from './ExportDialog'

export function PublishedExportButton({ slug }: { slug: string }) {
  return (
    <ExportDialog
      load={(format) => exportPublished(slug, format)}
      sourceNote="Exports the published version of this component."
      renderTrigger={(open) => (
        <button type="button" className="btn btn-secondary" onClick={open}>
          Export code
        </button>
      )}
    />
  )
}
