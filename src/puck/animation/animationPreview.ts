'use client'

import { useSyncExternalStore } from 'react'

const ATTRIBUTE = 'data-lc-anim-preview'

let previewing = false
let replayTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

/** The editor canvas lives in a same-origin iframe; sandboxed markup frames throw and are skipped. */
function documents(): Document[] {
  const found = [document]
  document.querySelectorAll('iframe').forEach((frame) => {
    try {
      if (frame.contentDocument) found.push(frame.contentDocument)
    } catch {
      // Cross-origin frame.
    }
  })
  return found
}

function apply(on: boolean) {
  for (const doc of documents()) {
    doc.documentElement.toggleAttribute(ATTRIBUTE, on)
    // Reading layout flushes styles, so removing then re-adding the attribute restarts every animation.
    void doc.documentElement.offsetWidth
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function playPreview() {
  apply(false)
  apply(true)
  previewing = true
  emit()
}

export function stopPreview() {
  clearTimeout(replayTimer)
  apply(false)
  previewing = false
  emit()
}

/** Restarts the preview after a settings change, once the canvas has re-rendered with the new values. */
export function replayPreview() {
  if (!previewing) return
  clearTimeout(replayTimer)
  replayTimer = setTimeout(playPreview, 150)
}

export function usePreviewing() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => previewing,
    () => false,
  )
}
