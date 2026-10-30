import type { CSSProperties } from 'react'

import { CANVAS_LIMITS, type Artboard, type ElementBox, type FreeCanvasProps, type FreeElement } from './canvasTypes'

export const VIEWPORTS = ['large', 'medium', 'small'] as const
export type Viewport = (typeof VIEWPORTS)[number]

export const VIEWPORT_LABELS: Record<Viewport, string> = {
  large: 'Large',
  medium: 'Medium',
  small: 'Small',
}

const percent = (value: number, total: number) => `${Math.round((value / total) * 1_000_000) / 10_000}%`

const clampBoard = (width: number, height: number): Artboard => {
  const [minW, maxW] = CANVAS_LIMITS.artboardWidth
  const [minH, maxH] = CANVAS_LIMITS.artboardHeight
  return {
    width: Math.round(Math.min(maxW, Math.max(minW, width))),
    height: Math.round(Math.min(maxH, Math.max(minH, height))),
  }
}

/** Narrower frames derived from the large artboard, until the author sets their own. */
export function defaultBoards(large: Artboard): Record<Viewport, Artboard> {
  const medium = clampBoard(Math.min(large.width, 768), large.height)
  const small = clampBoard(Math.min(medium.width, 480), large.height)
  return { large, medium, small }
}

export function canvasBoards(props: Pick<FreeCanvasProps, 'artboard' | 'viewports'>): Record<Viewport, Artboard> {
  const defaults = defaultBoards(props.artboard)
  const medium = props.viewports?.medium
    ? { ...props.viewports.medium, width: Math.min(props.viewports.medium.width, props.artboard.width) }
    : defaults.medium
  const smallWidth = Math.min((props.viewports?.small ?? defaults.small).width, medium.width)
  const small = props.viewports?.small ? { ...props.viewports.small, width: smallWidth } : { ...defaults.small, width: smallWidth }
  return { large: props.artboard, medium, small }
}

export function scaleBox(box: ElementBox, from: Artboard, to: Artboard): ElementBox {
  const sx = to.width / from.width
  const sy = to.height / from.height
  return {
    x: Math.round(box.x * sx),
    y: Math.round(box.y * sy),
    w: Math.max(CANVAS_LIMITS.minSize, Math.round(box.w * sx)),
    h: Math.max(CANVAS_LIMITS.minSize, Math.round(box.h * sy)),
    rotation: box.rotation,
    ...(box.hidden ? { hidden: true } : {}),
  }
}

function largeBox(element: FreeElement): ElementBox {
  return { x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation }
}

/** The box to draw at this size. Medium follows large, and small follows medium, until overridden. */
export function resolveBox(
  element: FreeElement,
  viewport: Viewport,
  boards: Record<Viewport, Artboard>,
): ElementBox {
  const large = largeBox(element)
  if (viewport === 'large') return large
  const medium = element.responsive?.medium ?? scaleBox(large, boards.large, boards.medium)
  if (viewport === 'medium') return medium
  return element.responsive?.small ?? scaleBox(medium, boards.medium, boards.small)
}

export type PlacedElement = FreeElement & { hidden?: boolean }

export function placeElement(
  element: FreeElement,
  viewport: Viewport,
  boards: Record<Viewport, Artboard>,
): PlacedElement {
  const box = resolveBox(element, viewport, boards)
  return { ...element, x: box.x, y: box.y, w: box.w, h: box.h, rotation: box.rotation, hidden: box.hidden }
}

/** Writes a box back onto the size being edited, leaving the other sizes alone. */
export function applyBox(element: FreeElement, viewport: Viewport, box: ElementBox): FreeElement {
  const next: ElementBox = {
    x: Math.round(box.x),
    y: Math.round(box.y),
    w: Math.round(box.w),
    h: Math.round(box.h),
    rotation: Math.round(box.rotation),
    ...(box.hidden ? { hidden: true } : {}),
  }
  if (viewport === 'large') {
    return { ...element, x: next.x, y: next.y, w: next.w, h: next.h, rotation: next.rotation }
  }
  return { ...element, responsive: { ...element.responsive, [viewport]: next } }
}

export function clearViewport(elements: FreeElement[], viewport: 'medium' | 'small'): FreeElement[] {
  return elements.map((element) => {
    if (!element.responsive?.[viewport]) return element
    const responsive = { ...element.responsive }
    delete responsive[viewport]
    return { ...element, responsive: responsive.medium || responsive.small ? responsive : undefined }
  })
}

export function placedStyle(box: ElementBox, board: Artboard): CSSProperties {
  return {
    left: percent(box.x, board.width),
    top: percent(box.y, board.height),
    width: percent(box.w, board.width),
    height: percent(box.h, board.height),
    transform: box.rotation ? `rotate(${box.rotation}deg)` : 'none',
    display: box.hidden ? 'none' : 'block',
  }
}

const BOX_KEYS = ['left', 'top', 'width', 'height', 'transform', 'display'] as const

/** Declarations that differ from the large layout, which is what the base rule already sets. */
function styleDiff(next: CSSProperties, base: CSSProperties): CSSProperties {
  const diff: CSSProperties = {}
  for (const key of BOX_KEYS) {
    const value = next[key] ?? (key === 'transform' ? 'none' : undefined)
    const previous = base[key] ?? (key === 'transform' ? 'none' : undefined)
    if (value !== previous && value !== undefined) diff[key] = value
  }
  return diff
}

export type ViewportQuery = {
  maxWidth: number
  /** Present on every size except the narrowest, so two queries never apply at once. */
  minWidth?: number
  canvas: CSSProperties
  elements: { id: string; style: CSSProperties }[]
}

export function mediaQuery({ maxWidth, minWidth }: Pick<ViewportQuery, 'maxWidth' | 'minWidth'>): string {
  const max = `(max-width: ${maxWidth}px)`
  return minWidth ? `(min-width: ${minWidth}px) and ${max}` : max
}

/**
 * One self-contained rule per size, compared with the large layout.
 * Medium stops where small begins, so a rotation kept on medium cannot leak into small.
 */
export function viewportOverrides(props: Pick<FreeCanvasProps, 'artboard' | 'viewports' | 'elements'>): ViewportQuery[] {
  const boards = canvasBoards(props)
  const largeLayout = (element: FreeElement) => placedStyle(resolveBox(element, 'large', boards), boards.large)
  const queries = (['medium', 'small'] as const).flatMap((viewport) => {
    const elements = props.elements.flatMap((element) => {
      const style = styleDiff(placedStyle(resolveBox(element, viewport, boards), boards[viewport]), largeLayout(element))
      return Object.keys(style).length ? [{ id: element.id, style }] : []
    })
    const board = boards[viewport]
    if (board.width === boards.large.width && board.height === boards.large.height && elements.length === 0) return []
    return [
      {
        maxWidth: board.width,
        canvas:
          board.width === boards.large.width && board.height === boards.large.height
            ? {}
            : { aspectRatio: `${board.width} / ${board.height}`, maxWidth: `${board.width}px` },
        elements,
      },
    ]
  })
  return queries.map((query, index) => {
    const narrower = queries[index + 1]
    return narrower ? { ...query, minWidth: narrower.maxWidth + 1 } : query
  })
}

const decl = (style: CSSProperties) =>
  Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`)
    .join(';')

/** Positions and frame size for every viewport. The editor draws one size itself and does not use this. */
export function responsiveCanvasCss(canvasId: string, props: Pick<FreeCanvasProps, 'artboard' | 'viewports' | 'elements'>): string {
  const id = canvasId.replace(/[^\w-]/g, '') || 'canvas'
  const scope = `[data-lc-canvas="${id}"]`
  const boards = canvasBoards(props)
  const lines = [
    `${scope}{aspect-ratio:${boards.large.width} / ${boards.large.height};max-width:${boards.large.width}px}`,
  ]
  for (const element of props.elements) {
    const box = resolveBox(element, 'large', boards)
    lines.push(`${scope} [data-lc-el="${element.id}"]{${decl(placedStyle(box, boards.large))}}`)
  }
  for (const query of viewportOverrides(props)) {
    const canvas = decl(query.canvas)
    const inner = canvas ? [`${scope}{${canvas}}`] : []
    for (const element of query.elements) {
      inner.push(`${scope} [data-lc-el="${element.id}"]{${decl(element.style)}}`)
    }
    if (inner.length) lines.push(`@media ${mediaQuery(query)}{${inner.join('')}}`)
  }
  return lines.join('\n')
}
