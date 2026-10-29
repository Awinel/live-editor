'use server'

import { EXPORT_FORMATS, exportComposition, type ExportFile, type ExportFormat } from '@/puck/export'

import { getPublishedComponent } from './components'
import { getCurrentUser } from './payload'

export type ExportResponse = { ok: true; files: ExportFile[] } | { ok: false; message: string }

const MAX_EXPORT_BYTES = 200_000

const isFormat = (value: unknown): value is ExportFormat => EXPORT_FORMATS.includes(value as ExportFormat)

export async function exportPublished(slug: string, format: ExportFormat): Promise<ExportResponse> {
  if (!isFormat(format)) return { ok: false, message: 'Unknown export format.' }
  const component = await getPublishedComponent(String(slug))
  if (!component) return { ok: false, message: 'This component is no longer published.' }
  return { ok: true, files: exportComposition(component.composition, format, component.title) }
}

/** Exports what is on screen in the editor, including unsaved changes. */
export async function exportDraft(data: unknown, format: ExportFormat): Promise<ExportResponse> {
  if (!isFormat(format)) return { ok: false, message: 'Unknown export format.' }
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Your session ended. Sign in again to export.' }
  if (JSON.stringify(data ?? null).length > MAX_EXPORT_BYTES) {
    return { ok: false, message: 'This component is too large to export.' }
  }

  const rootProps = (data as { root?: { props?: { title?: unknown } } } | null)?.root?.props
  const title = typeof rootProps?.title === 'string' && rootProps.title.trim() ? rootProps.title.trim() : 'Component'
  return { ok: true, files: exportComposition(data, format, title.slice(0, 80)) }
}
