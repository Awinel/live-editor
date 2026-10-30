export type WidthMode = 'auto' | 'fill' | 'fixed'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type BorderStyle = 'solid' | 'dashed' | 'dotted'
export type Shadow = 'none' | 'sm' | 'md' | 'lg'

/** One box-shadow layer; color plus alpha (0–100) so the picker can stay a plain hex input. */
export type ShadowLayer = {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  alpha: number
  inset?: boolean
}

export type BlockStyle = {
  widthMode?: WidthMode
  width?: number
  maxWidth?: number
  minHeight?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginBottom?: number
  background?: string
  color?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: TextAlign
  italic?: boolean
  uppercase?: boolean
  borderWidth?: number
  borderTopWidth?: number
  borderRightWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  borderStyle?: BorderStyle
  borderColor?: string
  radius?: number
  radiusTopLeft?: number
  radiusTopRight?: number
  radiusBottomRight?: number
  radiusBottomLeft?: number
  shadow?: Shadow
  /** Custom layers; when present they replace the shadow preset. */
  shadows?: ShadowLayer[]
  opacity?: number
}

export type NumericStyleKey = {
  [K in keyof BlockStyle]-?: NonNullable<BlockStyle[K]> extends number ? K : never
}[keyof BlockStyle]

export const NUMBER_LIMITS: Record<NumericStyleKey, [min: number, max: number]> = {
  width: [16, 2400],
  maxWidth: [16, 2400],
  minHeight: [0, 2400],
  paddingTop: [0, 400],
  paddingRight: [0, 400],
  paddingBottom: [0, 400],
  paddingLeft: [0, 400],
  marginTop: [-200, 400],
  marginBottom: [-200, 400],
  fontSize: [8, 240],
  fontWeight: [200, 800],
  lineHeight: [0.8, 3],
  letterSpacing: [-10, 40],
  borderWidth: [0, 40],
  borderTopWidth: [0, 40],
  borderRightWidth: [0, 40],
  borderBottomWidth: [0, 40],
  borderLeftWidth: [0, 40],
  radius: [0, 999],
  radiusTopLeft: [0, 999],
  radiusTopRight: [0, 999],
  radiusBottomRight: [0, 999],
  radiusBottomLeft: [0, 999],
  opacity: [0, 100],
}

export const BORDER_SIDES = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'] as const
export const RADIUS_CORNERS = ['radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft'] as const

export const SHADOW_LIMITS = {
  x: [-200, 200] as [number, number],
  y: [-200, 200] as [number, number],
  blur: [0, 400] as [number, number],
  spread: [-200, 200] as [number, number],
  alpha: [0, 100] as [number, number],
  layers: 4,
}

export const COLOR_KEYS = ['background', 'color', 'borderColor'] as const

export const ENUMS = {
  widthMode: ['auto', 'fill', 'fixed'],
  textAlign: ['left', 'center', 'right', 'justify'],
  borderStyle: ['solid', 'dashed', 'dotted'],
  shadow: ['none', 'sm', 'md', 'lg'],
} as const satisfies Partial<Record<keyof BlockStyle, readonly string[]>>

export const BOOLEAN_KEYS = ['italic', 'uppercase'] as const

export const FONT_WEIGHTS = [
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extra bold', value: 800 },
]

const teal = (y: number, blur: number, alpha: number): ShadowLayer => ({ x: 0, y, blur, spread: 0, color: '#0f4c5c', alpha })

export const SHADOW_PRESETS: Record<Exclude<Shadow, 'none'>, ShadowLayer[]> = {
  sm: [teal(1, 3, 18)],
  md: [teal(8, 20, 18)],
  lg: [teal(20, 48, 24)],
}

export const newShadowLayer = (): ShadowLayer => teal(8, 20, 20)

export const PALETTE = [
  { name: 'Crimson violet', value: '#5f0f40' },
  { name: 'Deep crimson', value: '#9a031e' },
  { name: 'Princeton orange', value: '#fb8b24' },
  { name: 'Autumn leaf', value: '#e36414' },
  { name: 'Dark teal', value: '#0f4c5c' },
  { name: 'Muted teal', value: '#3d6a76' },
  { name: 'Mist', value: '#e7f0f2' },
  { name: 'Paper', value: '#f7fbfc' },
  { name: 'White', value: '#ffffff' },
  { name: 'Ink', value: '#14161a' },
]

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i

export function isSafeColor(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 40 &&
    (value === 'transparent' || HEX.test(value) || RGB.test(value))
  )
}

/** Combines a safe color with an opacity (0–100) into rgba; any alpha already in the color is multiplied in. */
export function colorWithAlpha(color: string, alpha: number): string {
  if (!isSafeColor(color) || color === 'transparent') return 'transparent'
  let channels: number[]
  let base = 1
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const full = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex
    channels = [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16))
    if (full.length === 8) base = parseInt(full.slice(6, 8), 16) / 255
  } else {
    const numbers = color.match(/[\d.]+/g)!.map(Number)
    channels = numbers.slice(0, 3).map((value) => Math.min(255, value))
    if (numbers.length > 3) base = numbers[3]
  }
  const a = Math.round(base * (Math.min(100, Math.max(0, alpha)) / 100) * 100) / 100
  return `rgba(${channels.join(', ')}, ${a})`
}
