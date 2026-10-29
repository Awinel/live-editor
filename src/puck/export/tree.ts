import type { CSSProperties } from 'react'

import type { BlockAnimation } from '../animation/animationTypes'
import { sanitizeAnimation } from '../animation/sanitizeAnimation'
import type { PuckDocument } from '../blockTypes'
import type { Artboard, FreeCanvasProps, FreeElement } from '../canvas/canvasTypes'
import { boardStyle, boxStyle } from '../canvas/FreeCanvasView'
import { sanitizeCanvasProps } from '../canvas/sanitizeCanvas'
import type { BlockStyle } from '../style/styleTypes'
import { containerUnit, toStyle } from '../style/toStyle'
import { safeHref, safeSrc } from '../urls'
import type { Decls } from './classes'

export type ElementNode = {
  type: 'element'
  tag: string
  attrs: Record<string, string>
  classes: string[]
  style: Decls
  children: ExportNode[]
  animation?: BlockAnimation
}

/** Custom markup, already sanitized, rendered into its own shadow root so its CSS stays scoped. */
export type MarkupNode = { type: 'markup'; html: string; css: string; style: Decls; animation?: BlockAnimation }

export type ExportNode = ElementNode | { type: 'text'; text: string } | MarkupNode

const SHADOW_BASE_CSS =
  ':host{display:block;font-family:ui-sans-serif,system-ui,sans-serif;color:#0f4c5c;line-height:1.5}'

const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/**
 * Values come from validated styles; stripping CSS delimiters keeps a bad value from escaping its rule.
 * Border shorthands are split into longhands so they merge cleanly with base class declarations.
 */
export function toDecls(style: CSSProperties): Decls {
  const decls: Decls = {}
  for (const [key, raw] of Object.entries(style)) {
    if (raw === undefined || raw === null || raw === '') continue
    const value = String(raw).replace(/[;{}<>]/g, '')
    if (key === 'border') {
      if (value === 'none') {
        decls['border-width'] = '0'
        decls['border-style'] = 'none'
      } else {
        const [width, borderStyle, ...color] = value.split(' ')
        decls['border-width'] = width
        decls['border-style'] = borderStyle
        decls['border-color'] = color.join(' ')
      }
      continue
    }
    decls[kebab(key)] = value
  }
  return decls
}

const el = (
  tag: string,
  classes: string[],
  children: ExportNode[] = [],
  style: Decls = {},
  attrs: Record<string, string> = {},
): ElementNode => ({ type: 'element', tag, attrs, classes, style, children })

const text = (value: unknown): ExportNode[] =>
  typeof value === 'string' && value !== '' ? [{ type: 'text', text: value }] : []

const props = (item: Record<string, unknown>) => (item.props ?? {}) as Record<string, unknown>

function canvasElement(element: FreeElement, artboard: Artboard): ElementNode | null {
  const unit = containerUnit(artboard.width)
  const style = toStyle(element.style, unit)
  const { content } = element
  let body: ElementNode

  switch (element.kind) {
    case 'heading':
      body = el(content.level === 'h3' ? 'h3' : 'h2', ['lc-el-body', 'lc-el-heading'], text(content.text), toDecls(style))
      break
    case 'text':
      body = el('p', ['lc-el-body', 'lc-el-text'], text(content.text), toDecls(style))
      break
    case 'button':
      body = el('a', ['lc-el-body', 'lc-el-button'], text(content.text), toDecls(style), {
        href: safeHref(content.href ?? '#'),
      })
      break
    case 'image': {
      const src = safeSrc(content.src ?? '')
      if (!src) return null
      body = el('img', ['lc-el-body', 'lc-el-image'], [], toDecls({ ...style, objectFit: content.fit ?? 'cover' }), {
        src,
        alt: content.alt ?? '',
      })
      break
    }
    case 'shape':
      body = el(
        'div',
        ['lc-el-body'],
        [],
        toDecls({ ...style, borderRadius: content.shape === 'ellipse' ? '50%' : style.borderRadius }),
        { 'aria-hidden': 'true' },
      )
      break
  }

  // Animations run on the body so their transforms never replace the box's rotation.
  body.animation = element.animation
  return el('div', ['lc-el'], [body], toDecls(boxStyle(element, artboard)))
}

function canvasNode(raw: Record<string, unknown>): ElementNode {
  const canvas: FreeCanvasProps = sanitizeCanvasProps(raw)
  const children = canvas.elements
    .map((element) => canvasElement(element, canvas.artboard))
    .filter((node): node is ElementNode => node !== null)
  return el('div', ['lc-canvas'], children, toDecls(boardStyle({ ...canvas, frame: raw.style as BlockStyle })))
}

function blockNode(item: Record<string, unknown>): ExportNode | null {
  const node = blockBody(item)
  const animation = sanitizeAnimation(props(item).animation)
  if (node && node.type !== 'text' && animation) node.animation = animation
  return node
}

function blockBody(item: Record<string, unknown>): ExportNode | null {
  const p = props(item)
  const style = toDecls(toStyle(p.style))

  switch (item.type) {
    case 'Heading': {
      const level = p.level === 'h3' ? 'h3' : 'h2'
      const align = p.align === 'center' ? ['lc-align--center'] : []
      return el(level, ['lc-heading', `lc-heading--${level}`, ...align], text(p.text), style)
    }
    case 'Text': {
      const tone = p.tone === 'muted' ? ['lc-text--muted'] : []
      const align = p.align === 'center' ? ['lc-align--center'] : []
      return el('p', ['lc-text', ...tone, ...align], text(p.text), style)
    }
    case 'Image': {
      const src = safeSrc(String(p.src ?? ''))
      if (!src) return null
      const ratio: Decls = typeof p.ratio === 'string' && /^\d+\/\d+$/.test(p.ratio) ? { 'aspect-ratio': p.ratio } : {}
      return el('img', ['lc-image'], [], { ...ratio, ...style }, { src, alt: String(p.alt ?? ''), loading: 'lazy' })
    }
    case 'Button': {
      const variant = p.variant === 'outline' ? 'outline' : 'solid'
      return el('a', ['lc-button', `lc-button--${variant}`], text(p.label), style, {
        href: safeHref(String(p.href ?? '#')),
      })
    }
    case 'Stack': {
      const direction = p.direction === 'horizontal' ? 'horizontal' : 'vertical'
      const gap = ['sm', 'lg'].includes(String(p.gap)) ? String(p.gap) : 'md'
      const align = ['start', 'center'].includes(String(p.align)) ? String(p.align) : 'stretch'
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, unknown>>) : []
      return el(
        'div',
        ['lc-stack', `lc-stack--${direction}`, `lc-gap--${gap}`, `lc-items--${align}`],
        blockNodes(items),
        style,
      )
    }
    case 'Markup':
      return {
        type: 'markup',
        html: String(p.html ?? ''),
        css: `${SHADOW_BASE_CSS}${String(p.css ?? '')}`,
        style,
      }
    case 'FreeCanvas':
      return canvasNode(p)
    default:
      return null
  }
}

function blockNodes(items: Array<Record<string, unknown>>): ExportNode[] {
  return items.map(blockNode).filter((node): node is ExportNode => node !== null)
}

/** Expects a composition that already went through sanitizeComposition. */
export function buildTree(composition: PuckDocument): ElementNode {
  return el('div', ['lc-root'], blockNodes(composition.content))
}
