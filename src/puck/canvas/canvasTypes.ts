import type { BlockAnimation } from '../animation/animationTypes'
import type { BlockStyle } from '../style/styleTypes'

export const ELEMENT_KINDS = ['heading', 'text', 'button', 'image', 'shape'] as const
export type ElementKind = (typeof ELEMENT_KINDS)[number]

export type ElementContent = {
  text?: string
  level?: 'h2' | 'h3'
  href?: string
  src?: string
  alt?: string
  fit?: 'cover' | 'contain'
  shape?: 'rect' | 'ellipse'
}

export type FreeElement = {
  id: string
  kind: ElementKind
  x: number
  y: number
  w: number
  h: number
  rotation: number
  content: ElementContent
  style?: BlockStyle
  animation?: BlockAnimation
}

export type Artboard = { width: number; height: number }
export type GridSize = 4 | 8 | 16 | 24
export type GridSettings = { show: boolean; snap: boolean; size: GridSize }

export type FreeCanvasProps = {
  artboard: Artboard
  background?: string
  grid: GridSettings
  elements: FreeElement[]
}

export const CANVAS_LIMITS = {
  maxElements: 60,
  maxText: 2_000,
  maxUrl: 2_000,
  minSize: 8,
  artboardWidth: [240, 2400] as [number, number],
  artboardHeight: [120, 2400] as [number, number],
}

export const GRID_SIZES: GridSize[] = [4, 8, 16, 24]

export const ARTBOARD_PRESETS = [
  { label: 'Wide 16:9', width: 960, height: 540 },
  { label: 'Classic 4:3', width: 800, height: 600 },
  { label: 'Square', width: 600, height: 600 },
  { label: 'Banner', width: 1200, height: 400 },
  { label: 'Story 9:16', width: 540, height: 960 },
]

export const KIND_LABELS: Record<ElementKind, string> = {
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  shape: 'Shape',
}

export const newElementId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)

const TEMPLATES: Record<ElementKind, Omit<FreeElement, 'id' | 'x' | 'y' | 'rotation'>> = {
  heading: {
    kind: 'heading',
    w: 520,
    h: 112,
    content: { text: 'Design anything here', level: 'h2' },
    style: { fontSize: 48, fontWeight: 700, lineHeight: 1.05, color: '#5f0f40' },
  },
  text: {
    kind: 'text',
    w: 420,
    h: 84,
    content: { text: 'Drag me anywhere, resize from the corners and rotate from the top handle.' },
    style: { fontSize: 18, lineHeight: 1.5, color: '#0f4c5c' },
  },
  button: {
    kind: 'button',
    w: 168,
    h: 48,
    content: { text: 'Get started', href: '#' },
    style: { fontSize: 16, fontWeight: 600, background: '#9a031e', color: '#ffffff', radius: 6 },
  },
  image: {
    kind: 'image',
    w: 320,
    h: 200,
    content: { src: '', alt: '', fit: 'cover' },
    style: { radius: 8 },
  },
  shape: {
    kind: 'shape',
    w: 160,
    h: 160,
    content: { shape: 'rect' },
    style: { background: '#fb8b24' },
  },
}

export function createElement(kind: ElementKind, artboard: Artboard): FreeElement {
  const template = structuredClone(TEMPLATES[kind])
  const w = Math.min(template.w, artboard.width)
  const h = Math.min(template.h, artboard.height)
  return {
    ...template,
    id: newElementId(),
    w,
    h,
    x: Math.round((artboard.width - w) / 2),
    y: Math.round((artboard.height - h) / 2),
    rotation: 0,
  }
}

export function defaultCanvasProps(): FreeCanvasProps {
  const artboard = { width: 960, height: 540 }
  return {
    artboard,
    background: '#f7fbfc',
    grid: { show: true, snap: true, size: 8 },
    elements: [
      { ...createElement('shape', artboard), x: 704, y: 296, w: 192, h: 192, content: { shape: 'ellipse' } },
      { ...createElement('heading', artboard), x: 64, y: 96 },
      { ...createElement('text', artboard), x: 64, y: 224 },
      { ...createElement('button', artboard), x: 64, y: 336 },
    ],
  }
}
