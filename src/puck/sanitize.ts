import sanitizeHtml from 'sanitize-html'

import {
  BLOCK_TYPES,
  clampMarkupHeight,
  emptyComposition,
  type BlockType,
  type PuckDocument,
} from './blockTypes'

const MAX_MARKUP_LENGTH = 20_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isComponentItem = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && typeof value.type === 'string' && isRecord(value.props)

export function sanitizeMarkupHtml(html: string): string {
  return sanitizeHtml(html.slice(0, MAX_MARKUP_LENGTH), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'button', 'picture']),
    allowedAttributes: {
      '*': ['class', 'id', 'role', 'title', 'aria-*', 'data-*'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      button: ['type'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['https', 'data'] },
    allowProtocolRelative: false,
  })
}

// Escapes are stripped so `url(`, `@import` and `</style` cannot be smuggled past the checks below.
export function sanitizeMarkupCss(css: string): string {
  return css
    .slice(0, MAX_MARKUP_LENGTH)
    .replace(/\\/g, '')
    .replace(/</g, '')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\s*\(/gi, 'none(')
    .replace(/expression\s*\(/gi, 'none(')
}

function sanitizeItem(item: unknown): Record<string, unknown> | null {
  if (!isComponentItem(item) || !BLOCK_TYPES.includes(item.type as BlockType)) return null

  const props: Record<string, unknown> = { ...(item.props as Record<string, unknown>) }

  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value) && value.every(isComponentItem)) {
      props[key] = value.map(sanitizeItem).filter(Boolean)
    }
  }

  if (item.type === 'Markup') {
    props.html = sanitizeMarkupHtml(String(props.html ?? ''))
    props.css = sanitizeMarkupCss(String(props.css ?? ''))
    props.height = clampMarkupHeight(props.height)
  }

  return { type: item.type, props }
}

export function sanitizeComposition(value: unknown): PuckDocument {
  if (!isRecord(value)) return emptyComposition()

  const content = Array.isArray(value.content)
    ? (value.content.map(sanitizeItem).filter(Boolean) as Array<Record<string, unknown>>)
    : []

  const root = isRecord(value.root) ? value.root : { props: {} }

  return { content, root }
}
