import {
  BOOLEAN_KEYS,
  COLOR_KEYS,
  ENUMS,
  NUMBER_LIMITS,
  isSafeColor,
  type BlockStyle,
  type NumericStyleKey,
} from './styleTypes'

export function clampNumber(value: unknown, [min, max]: [number, number]): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const number = Number(value)
  if (!Number.isFinite(number)) return undefined
  return Math.min(max, Math.max(min, Math.round(number * 100) / 100))
}

export function sanitizeStyle(value: unknown): BlockStyle | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const input = value as Record<string, unknown>
  const style: Record<string, unknown> = {}

  for (const key of Object.keys(NUMBER_LIMITS) as NumericStyleKey[]) {
    const number = clampNumber(input[key], NUMBER_LIMITS[key])
    if (number !== undefined) style[key] = number
  }

  for (const key of COLOR_KEYS) {
    if (isSafeColor(input[key])) style[key] = input[key]
  }

  for (const [key, options] of Object.entries(ENUMS)) {
    if ((options as readonly unknown[]).includes(input[key])) style[key] = input[key]
  }

  for (const key of BOOLEAN_KEYS) {
    if (input[key] === true) style[key] = true
  }

  return Object.keys(style).length ? (style as BlockStyle) : undefined
}
