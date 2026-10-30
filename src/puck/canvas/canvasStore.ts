import { useSyncExternalStore } from 'react'

import type { Viewport } from './viewports'

const selected = new Map<string, string | null>()
const viewports = new Map<string, Viewport>()
const listeners = new Set<() => void>()

export function selectElement(blockId: string, elementId: string | null) {
  if ((selected.get(blockId) ?? null) === elementId) return
  selected.set(blockId, elementId)
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setViewport(blockId: string, viewport: Viewport) {
  if ((viewports.get(blockId) ?? 'large') === viewport) return
  viewports.set(blockId, viewport)
  listeners.forEach((listener) => listener())
}

export function useViewport(blockId: string | undefined): Viewport {
  return useSyncExternalStore(
    subscribe,
    () => (blockId ? (viewports.get(blockId) ?? 'large') : 'large'),
    () => 'large',
  )
}

/** Shared between the canvas (inside Puck's iframe) and the sidebar fields, which live in one React tree. */
export function useSelectedElement(blockId: string | undefined): string | null {
  return useSyncExternalStore(
    subscribe,
    () => (blockId ? (selected.get(blockId) ?? null) : null),
    () => null,
  )
}
