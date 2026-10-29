export type WidthMode = 'auto' | 'fill' | 'fixed'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type BorderStyle = 'solid' | 'dashed' | 'dotted'
export type Shadow = 'none' | 'sm' | 'md' | 'lg'

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
  borderStyle?: BorderStyle
  borderColor?: string
  radius?: number
  shadow?: Shadow
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
  radius: [0, 999],
  opacity: [0, 100],
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

export const SHADOWS: Record<Exclude<Shadow, 'none'>, string> = {
  sm: '0 1px 3px rgba(15, 76, 92, 0.18)',
  md: '0 8px 20px rgba(15, 76, 92, 0.18)',
  lg: '0 20px 48px rgba(15, 76, 92, 0.24)',
}

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
