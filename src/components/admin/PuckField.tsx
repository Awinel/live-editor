'use client'

import '@puckeditor/core/puck.css'
import '../../puck/blocks.css'
import './PuckField.css'

import { Puck, type Viewports } from '@puckeditor/core'
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

import { emptyComposition } from '../../puck/blockTypes'
import { config, type ComponentData } from '../../puck/config'

// The canvas sits inside Payload's main column, so preview at component widths rather than page widths.
const ADMIN_VIEWPORTS: Viewports = [
  { width: 360, height: 'auto', icon: 'Smartphone', label: 'Narrow' },
  { width: 640, height: 'auto', icon: 'Tablet', label: 'Card' },
  { width: '100%', height: 'auto', icon: 'FullWidth', label: 'Fit' },
]

const toComposition = (value: unknown): ComponentData => {
  if (value && typeof value === 'object' && Array.isArray((value as ComponentData).content)) {
    return value as ComponentData
  }
  return emptyComposition() as ComponentData
}

// Enter inside a Puck input would otherwise submit (and save) the surrounding Payload form.
const blockImplicitSubmit = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
    event.preventDefault()
  }
}

export const PuckField: JSONFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<ComponentData>({ path })
  const [initialData] = useState(() => toComposition(value))
  const lastSerialized = useRef(JSON.stringify(initialData))
  const [host, setHost] = useState<HTMLDivElement | null>(null)

  const handleChange = useCallback(
    (data: ComponentData) => {
      const serialized = JSON.stringify(data)
      if (serialized === lastSerialized.current) return
      lastSerialized.current = serialized
      setValue(data)
    },
    [setValue],
  )

  const label = typeof field.label === 'string' ? field.label : 'Composition'

  return (
    <div className="field-type lc-admin-field" onKeyDownCapture={blockImplicitSubmit}>
      <FieldLabel label={label} path={path} required={field.required} />
      <FieldDescription
        path={path}
        description="Drag blocks onto the canvas and edit them on the right. Use Save or Publish above to keep your changes."
      />
      {/* Puck renders its own <form>; mounting it through a client-only portal keeps
          that form out of Payload's form tree and out of the server-rendered HTML. */}
      <div className="lc-admin-field__editor" ref={setHost}>
        {host &&
          createPortal(
            <Puck
              config={config}
              data={initialData}
              onChange={handleChange}
              height="100%"
              headerTitle="Component canvas"
              ui={{ leftSideBarWidth: 190, rightSideBarWidth: 260 }}
              viewports={ADMIN_VIEWPORTS}
              overrides={{ headerActions: () => <></> }}
            />,
            host,
          )}
      </div>
    </div>
  )
}
