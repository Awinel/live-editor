import { useSyncExternalStore } from 'react'

const selected = new Map<string, string | null>()
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

/** Shared between the canvas (inside Puck's iframe) and the sidebar fields, which live in one React tree. */
export function useSelectedElement(blockId: string | undefined): string | null {
  return useSyncExternalStore(
    subscribe,
    () => (blockId ? (selected.get(blockId) ?? null) : null),
    () => null,
  )
}
