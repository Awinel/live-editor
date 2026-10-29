import type { CSSProperties } from 'react'

import { sanitizeStyle } from './sanitizeStyle'
import { SHADOWS, type BlockStyle } from './styleTypes'

export type LengthUnit = (px: number) => string

export const px: LengthUnit = (value) => `${value}px`

/** Lengths relative to the nearest size container, so a design scales with its artboard. */
export const containerUnit =
  (artboardWidth: number): LengthUnit =>
  (value) =>
    `${Math.round((value * 100_000) / artboardWidth) / 1000}cqw`

/** Re-validates on every render so unsaved or legacy data can never emit arbitrary CSS. */
export function toStyle(raw: unknown, unit: LengthUnit = px): CSSProperties {
  const style: BlockStyle | undefined = sanitizeStyle(raw)
  if (!style) return {}
  const css: CSSProperties = {}

  if (style.widthMode === 'fill') {
    css.width = '100%'
    css.alignSelf = 'stretch'
  } else if (style.widthMode === 'fixed' && style.width !== undefined) {
    css.width = unit(style.width)
    css.maxWidth = '100%'
  }
  if (style.maxWidth !== undefined) css.maxWidth = unit(style.maxWidth)
  if (style.minHeight !== undefined) css.minHeight = unit(style.minHeight)

  if (style.paddingTop !== undefined) css.paddingTop = unit(style.paddingTop)
  if (style.paddingRight !== undefined) css.paddingRight = unit(style.paddingRight)
  if (style.paddingBottom !== undefined) css.paddingBottom = unit(style.paddingBottom)
  if (style.paddingLeft !== undefined) css.paddingLeft = unit(style.paddingLeft)
  if (style.marginTop !== undefined) css.marginTop = unit(style.marginTop)
  if (style.marginBottom !== undefined) css.marginBottom = unit(style.marginBottom)

  if (style.background) css.background = style.background
  if (style.color) css.color = style.color

  if (style.fontSize !== undefined) css.fontSize = unit(style.fontSize)
  if (style.fontWeight !== undefined) css.fontWeight = style.fontWeight
  if (style.lineHeight !== undefined) css.lineHeight = style.lineHeight
  if (style.letterSpacing !== undefined) css.letterSpacing = unit(style.letterSpacing)
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.italic) css.fontStyle = 'italic'
  if (style.uppercase) css.textTransform = 'uppercase'

  if (style.borderWidth !== undefined) {
    css.border =
      style.borderWidth === 0
        ? 'none'
        : `${unit(style.borderWidth)} ${style.borderStyle ?? 'solid'} ${style.borderColor ?? 'currentColor'}`
  } else if (style.borderColor) {
    css.borderColor = style.borderColor
  }
  if (style.radius !== undefined) css.borderRadius = unit(style.radius)
  if (style.shadow && style.shadow !== 'none') css.boxShadow = SHADOWS[style.shadow]
  if (style.opacity !== undefined) css.opacity = style.opacity / 100

  return css
}
