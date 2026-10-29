import { clampNumber, sanitizeStyle } from '../style/sanitizeStyle'
import { isSafeColor } from '../style/styleTypes'
import {
  CANVAS_LIMITS,
  ELEMENT_KINDS,
  GRID_SIZES,
  type ElementContent,
  type ElementKind,
  type FreeCanvasProps,
  type FreeElement,
  type GridSize,
} from './canvasTypes'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : undefined)

function sanitizeContent(kind: ElementKind, value: unknown): ElementContent {
  const input = isRecord(value) ? value : {}
  switch (kind) {
    case 'heading':
      return {
        text: text(input.text, CANVAS_LIMITS.maxText) ?? '',
        level: input.level === 'h3' ? 'h3' : 'h2',
      }
    case 'text':
      return { text: text(input.text, CANVAS_LIMITS.maxText) ?? '' }
    case 'button':
      return {
        text: text(input.text, 120) ?? '',
        href: text(input.href, CANVAS_LIMITS.maxUrl) ?? '#',
      }
    case 'image':
      return {
        src: text(input.src, CANVAS_LIMITS.maxUrl) ?? '',
        alt: text(input.alt, 300) ?? '',
        fit: input.fit === 'contain' ? 'contain' : 'cover',
      }
    case 'shape':
      return { shape: input.shape === 'ellipse' ? 'ellipse' : 'rect' }
  }
}

function sanitizeElement(
  value: unknown,
  board: { width: number; height: number },
): FreeElement | null {
  if (!isRecord(value) || !ELEMENT_KINDS.includes(value.kind as ElementKind)) return null
  const kind = value.kind as ElementKind
  const { minSize } = CANVAS_LIMITS
  const w = clampNumber(value.w, [minSize, board.width * 2]) ?? 100
  const h = clampNumber(value.h, [minSize, board.height * 2]) ?? 100

  return {
    id: text(value.id, 40)?.replace(/[^\w-]/g, '') || Math.random().toString(36).slice(2, 10),
    kind,
    x: clampNumber(value.x, [-w, board.width]) ?? 0,
    y: clampNumber(value.y, [-h, board.height]) ?? 0,
    w,
    h,
    rotation: clampNumber(value.rotation, [-180, 180]) ?? 0,
    content: sanitizeContent(kind, value.content),
    style: sanitizeStyle(value.style),
  }
}

export function sanitizeCanvasProps(value: unknown): FreeCanvasProps {
  const input = isRecord(value) ? value : {}
  const artboardInput = isRecord(input.artboard) ? input.artboard : {}
  const artboard = {
    width: Math.round(clampNumber(artboardInput.width, CANVAS_LIMITS.artboardWidth) ?? 960),
    height: Math.round(clampNumber(artboardInput.height, CANVAS_LIMITS.artboardHeight) ?? 540),
  }
  const gridInput = isRecord(input.grid) ? input.grid : {}
  const size = Number(gridInput.size) as GridSize

  return {
    artboard,
    background: isSafeColor(input.background) ? input.background : undefined,
    grid: {
      show: gridInput.show === true,
      snap: gridInput.snap === true,
      size: GRID_SIZES.includes(size) ? size : 8,
    },
    elements: (Array.isArray(input.elements) ? input.elements : [])
      .slice(0, CANVAS_LIMITS.maxElements)
      .map((element) => sanitizeElement(element, artboard))
      .filter((element): element is FreeElement => element !== null),
  }
}
