import {
  BOOLEAN_KEYS,
  COLOR_KEYS,
  ENUMS,
  NUMBER_LIMITS,
  SHADOW_LIMITS,
  isSafeColor,
  type BlockStyle,
  type NumericStyleKey,
  type ShadowLayer,
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

  const shadows = sanitizeShadows(input.shadows)
  if (shadows) style.shadows = shadows

  return Object.keys(style).length ? (style as BlockStyle) : undefined
}

function sanitizeShadows(value: unknown): ShadowLayer[] | undefined {
  if (!Array.isArray(value)) return undefined
  const layers = value
    .slice(0, SHADOW_LIMITS.layers)
    .filter((layer): layer is Record<string, unknown> => typeof layer === 'object' && layer !== null)
    .map((layer) => ({
      x: clampNumber(layer.x, SHADOW_LIMITS.x) ?? 0,
      y: clampNumber(layer.y, SHADOW_LIMITS.y) ?? 0,
      blur: clampNumber(layer.blur, SHADOW_LIMITS.blur) ?? 0,
      spread: clampNumber(layer.spread, SHADOW_LIMITS.spread) ?? 0,
      color: isSafeColor(layer.color) ? layer.color : '#0f4c5c',
      alpha: clampNumber(layer.alpha, SHADOW_LIMITS.alpha) ?? 25,
      ...(layer.inset === true ? { inset: true } : {}),
    }))
  return layers.length ? layers : undefined
}
