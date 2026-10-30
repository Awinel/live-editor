import { sanitizeAnimation } from '../animation/sanitizeAnimation'
import { clampNumber, sanitizeStyle } from '../style/sanitizeStyle'
import { isSafeColor } from '../style/styleTypes'
import { safeFieldName } from '../urls'
import {
  CANVAS_LIMITS,
  ELEMENT_KINDS,
  GRID_SIZES,
  isInputType,
  type Artboard,
  type ElementBox,
  type ElementContent,
  type ElementKind,
  type FreeCanvasProps,
  type FreeElement,
  type GridSize,
} from './canvasTypes'
import { isShapeId } from './shapes'
import { canvasBoards } from './viewports'

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
    case 'input': {
      const name = safeFieldName(typeof input.name === 'string' ? input.name : undefined)
      return {
        label: text(input.label, 120) ?? '',
        text: text(input.text, 500) ?? '',
        placeholder: text(input.placeholder, 200) ?? '',
        ...(name ? { name } : {}),
        inputType: isInputType(input.inputType) ? input.inputType : 'text',
      }
    }
    case 'shape': {
      const label = text(input.text, CANVAS_LIMITS.maxText)
      return { shape: isShapeId(input.shape) ? input.shape : 'rect', ...(label ? { text: label } : {}) }
    }
  }
}

function sanitizeArtboard(value: unknown): Artboard | undefined {
  if (!isRecord(value)) return undefined
  const width = clampNumber(value.width, CANVAS_LIMITS.artboardWidth)
  const height = clampNumber(value.height, CANVAS_LIMITS.artboardHeight)
  if (width === undefined || height === undefined) return undefined
  return { width: Math.round(width), height: Math.round(height) }
}

function sanitizeBox(value: unknown, board: Artboard): ElementBox | undefined {
  if (!isRecord(value)) return undefined
  const { minSize } = CANVAS_LIMITS
  const w = clampNumber(value.w, [minSize, board.width * 2])
  const h = clampNumber(value.h, [minSize, board.height * 2])
  if (w === undefined || h === undefined) return undefined
  return {
    x: clampNumber(value.x, [-w, board.width]) ?? 0,
    y: clampNumber(value.y, [-h, board.height]) ?? 0,
    w,
    h,
    rotation: clampNumber(value.rotation, [-180, 180]) ?? 0,
    ...(value.hidden === true ? { hidden: true } : {}),
  }
}

function sanitizeElement(value: unknown, boards: Record<'large' | 'medium' | 'small', Artboard>): FreeElement | null {
  if (!isRecord(value) || !ELEMENT_KINDS.includes(value.kind as ElementKind)) return null
  const kind = value.kind as ElementKind
  const { minSize } = CANVAS_LIMITS
  const w = clampNumber(value.w, [minSize, boards.large.width * 2]) ?? 100
  const h = clampNumber(value.h, [minSize, boards.large.height * 2]) ?? 100
  const responsiveInput = isRecord(value.responsive) ? value.responsive : {}
  const medium = sanitizeBox(responsiveInput.medium, boards.medium)
  const small = sanitizeBox(responsiveInput.small, boards.small)

  return {
    id: text(value.id, 40)?.replace(/[^\w-]/g, '') || Math.random().toString(36).slice(2, 10),
    kind,
    x: clampNumber(value.x, [-w, boards.large.width]) ?? 0,
    y: clampNumber(value.y, [-h, boards.large.height]) ?? 0,
    w,
    h,
    rotation: clampNumber(value.rotation, [-180, 180]) ?? 0,
    content: sanitizeContent(kind, value.content),
    style: sanitizeStyle(value.style),
    animation: sanitizeAnimation(value.animation),
    ...(medium || small ? { responsive: { ...(medium ? { medium } : {}), ...(small ? { small } : {}) } } : {}),
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
  const rawViewports = isRecord(input.viewports) ? input.viewports : {}
  let medium = sanitizeArtboard(rawViewports.medium)
  let small = sanitizeArtboard(rawViewports.small)
  if (medium && medium.width > artboard.width) medium = { ...medium, width: artboard.width }
  if (small && small.width > (medium?.width ?? artboard.width)) small = { ...small, width: medium?.width ?? artboard.width }
  const viewports = medium || small ? { ...(medium ? { medium } : {}), ...(small ? { small } : {}) } : undefined
  const boards = canvasBoards({ artboard, viewports })

  return {
    artboard,
    background: isSafeColor(input.background) ? input.background : undefined,
    grid: {
      show: gridInput.show === true,
      snap: gridInput.snap === true,
      size: GRID_SIZES.includes(size) ? size : 8,
    },
    ...(viewports ? { viewports } : {}),
    elements: (Array.isArray(input.elements) ? input.elements : [])
      .slice(0, CANVAS_LIMITS.maxElements)
      .map((element) => sanitizeElement(element, boards))
      .filter((element): element is FreeElement => element !== null),
  }
}
