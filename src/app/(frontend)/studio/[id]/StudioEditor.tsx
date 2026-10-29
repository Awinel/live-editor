'use client'

import { Button, Puck, useGetPuck } from '@puckeditor/core'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'

import { ExportDialog } from '@/components/site/ExportDialog'
import { exportDraft } from '@/lib/exportActions'
import { studioConfig, type ComponentData } from '@/puck/config'

import { saveComponent, type SaveIntent, type SaveResult } from '../actions'

type StudioEditorProps = {
  id: number
  initialData: ComponentData
  isAdmin: boolean
}

function StudioActions({ id, isAdmin }: Omit<StudioEditorProps, 'initialData'>) {
  const getPuck = useGetPuck()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SaveResult | null>(null)

  const run = (intent: SaveIntent) =>
    startTransition(async () => {
      setResult(null)
      setResult(await saveComponent(id, getPuck().appState.data, intent))
    })

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span
        role="status"
        className={`text-sm font-semibold ${result?.ok === false ? 'text-crimson' : 'text-teal'}`}
      >
        {result?.message}
      </span>
      <Link href="/studio" className="text-sm font-semibold text-teal hover:text-violet">
        Back to studio
      </Link>
      <ExportDialog
        load={(format) => exportDraft(getPuck().appState.data, format)}
        sourceNote="Exports what is on the canvas now, including changes you have not saved."
        renderTrigger={(open) => (
          <Button type="button" variant="secondary" onClick={open}>
            Export
          </Button>
        )}
      />
      <Button type="button" variant="secondary" onClick={() => run('save')} disabled={pending}>
        Save draft
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={() => run(isAdmin ? 'publish' : 'submit')}
        disabled={pending}
      >
        {isAdmin ? 'Publish' : 'Submit for review'}
      </Button>
    </div>
  )
}

export function StudioEditor({ id, initialData, isAdmin }: StudioEditorProps) {
  // A stable override keeps the save status message when the page revalidates after saving.
  const overrides = useMemo(
    () => ({ headerActions: () => <StudioActions id={id} isAdmin={isAdmin} /> }),
    [id, isAdmin],
  )

  return (
    <div className="lc-studio">
      <Puck config={studioConfig} data={initialData} overrides={overrides} />
    </div>
  )
}
