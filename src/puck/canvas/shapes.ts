import type { CSSProperties } from 'react'

import { withoutCorners } from '../style/toStyle'

type ShapeDef = {
  id: string
  label: string
  /** Percentage polygon. Omitted for the rectangle and the ellipse, which use the box itself. */
  clip?: string
}

export const SHAPES = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { id: 'rightTriangle', label: 'Right triangle', clip: 'polygon(0% 0%, 100% 100%, 0% 100%)' },
  { id: 'diamond', label: 'Diamond', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  {
    id: 'pentagon',
    label: 'Pentagon',
    clip: 'polygon(50% 0%, 97.6% 34.5%, 79.4% 90.5%, 20.6% 90.5%, 2.4% 34.5%)',
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    clip: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
  },
  {
    id: 'octagon',
    label: 'Octagon',
    clip: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  },
  {
    id: 'star',
    label: 'Star',
    clip: 'polygon(50% 0%, 61.2% 34.5%, 97.6% 34.5%, 68.2% 55.9%, 79.4% 90.5%, 50% 69.1%, 20.6% 90.5%, 31.8% 55.9%, 2.4% 34.5%, 38.8% 34.5%)',
  },
  {
    id: 'heart',
    label: 'Heart',
    clip: 'polygon(50% 25.7%, 52.6% 17.1%, 57.9% 9.8%, 66.3% 4.6%, 76.4% 4%, 86.3% 8.6%, 93.4% 17.6%, 96% 28.9%, 93.4% 40.9%, 86.3% 52.2%, 76.4% 62.7%, 66.3% 72.4%, 57.9% 81.3%, 52.6% 88.9%, 50.3% 94.1%, 50% 96%, 49.7% 94.1%, 47.4% 88.9%, 42.1% 81.3%, 33.7% 72.4%, 23.6% 62.7%, 13.7% 52.2%, 6.6% 40.9%, 4% 28.9%, 6.6% 17.6%, 13.7% 8.6%, 23.6% 4%, 33.7% 4.6%, 42.1% 9.8%, 47.4% 17.1%)',
  },
  {
    id: 'arrow',
    label: 'Arrow',
    clip: 'polygon(0% 30%, 65% 30%, 65% 0%, 100% 50%, 65% 100%, 65% 70%, 0% 70%)',
  },
  {
    id: 'cross',
    label: 'Cross',
    clip: 'polygon(30% 0%, 70% 0%, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%, 0% 30%, 30% 30%)',
  },
] as const satisfies readonly ShapeDef[]

export type ShapeId = (typeof SHAPES)[number]['id']

const SHAPE_IDS = new Set<string>(SHAPES.map((shape) => shape.id))

export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === 'string' && SHAPE_IDS.has(value)
}

export function shapeLabel(id: string | undefined): string {
  return SHAPES.find((shape) => shape.id === id)?.label ?? 'Rectangle'
}

/** Splits a box-shadow list without breaking commas inside rgba(). */
function shadowLayers(value: string): string[] {
  const layers: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (char === ',' && depth === 0) {
      layers.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  const last = value.slice(start).trim()
  if (last) layers.push(last)
  return layers
}

const SHADOW_LAYER =
  /^(inset\s+)?(-?[\d.]+[a-z%]*)\s+(-?[\d.]+[a-z%]*)\s+(-?[\d.]+[a-z%]*)\s+(-?[\d.]+[a-z%]*)\s+(\S.*)$/

/**
 * A clip-path crops the box shadow, so outer shadows become drop-shadows that follow the silhouette.
 * Inset shadows stay, and an unparseable list is left alone.
 */
function shadowFollowsOutline(css: CSSProperties): CSSProperties {
  if (typeof css.boxShadow !== 'string' || css.boxShadow === '' || css.boxShadow === 'none') return css
  const drops: string[] = []
  const inset: string[] = []
  for (const layer of shadowLayers(css.boxShadow)) {
    const match = SHADOW_LAYER.exec(layer)
    if (!match) return css
    const [, insetFlag, x, y, blur, , color] = match
    if (insetFlag) inset.push(layer)
    else drops.push(`drop-shadow(${x} ${y} ${blur} ${color})`)
  }
  const next = { ...css }
  delete next.boxShadow
  if (inset.length) next.boxShadow = inset.join(', ')
  if (drops.length) next.filter = drops.join(' ')
  return next
}

/** Paints a shape into its box. Rectangles keep their corners; every other form has a fixed outline. */
export function shapeStyle(shape: ShapeId | undefined, style: CSSProperties): CSSProperties {
  const id: ShapeId = isShapeId(shape) ? shape : 'rect'
  if (id === 'rect') return style
  const fixed = withoutCorners(style)
  if (id === 'ellipse') return { ...fixed, borderRadius: '50%' }
  const match = SHAPES.find((item) => item.id === id)
  const clip = match && 'clip' in match ? match.clip : undefined
  return shadowFollowsOutline(clip ? { ...fixed, clipPath: clip } : fixed)
}
