export const BLOCK_TYPES = [
  'Heading',
  'Text',
  'Image',
  'Button',
  'Input',
  'Stack',
  'Markup',
  'FreeCanvas',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

export type PuckDocument = {
  content: Array<Record<string, unknown>>
  root: Record<string, unknown>
  zones?: Record<string, unknown>
}

export const emptyComposition = (): PuckDocument => ({
  content: [],
  root: { props: {} },
})

export const MARKUP_HEIGHT = { min: 80, max: 1200, fallback: 240 }

export function clampMarkupHeight(value: unknown): number {
  const height = Number(value)
  if (!Number.isFinite(height)) return MARKUP_HEIGHT.fallback
  return Math.min(MARKUP_HEIGHT.max, Math.max(MARKUP_HEIGHT.min, Math.round(height)))
}
