import {
  ANIMATION_RULES,
  SCROLL_TIMELINE,
  animationClasses,
  animationShorthand,
  animationVars,
  keyframesCss,
} from '../animation/animationCss'
import type { AnimationPreset, BlockAnimation } from '../animation/animationTypes'
import { CLASS_DEFS, type Decls } from './classes'
import { mediaQuery } from '../canvas/viewports'
import type { ElementNode, ExportNode, ResponsiveRule } from './tree'

type ClassResolver = (
  classes: string[],
  style: Decls,
  animation?: BlockAnimation,
  responsive?: ResponsiveRule[],
) => string

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttr = (value: string) => escapeText(value).replace(/"/g, '&quot;')

const VOID_TAGS = new Set(['img', 'input'])

type SerializeOptions = { jsx?: boolean }

function attributes(node: ElementNode, resolve: ClassResolver, options: SerializeOptions) {
  const className = resolve(node.classes, node.style, node.animation, node.responsive)
  const classAttr = options.jsx ? 'className' : 'class'
  const pairs = Object.entries({ ...(className ? { [classAttr]: className } : {}), ...node.attrs })
  return pairs.map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('')
}

function serialize(node: ExportNode, resolve: ClassResolver, depth: number, options: SerializeOptions = {}): string {
  const indent = '  '.repeat(depth)

  if (node.type === 'text') return `${indent}${escapeText(node.text)}`

  if (node.type === 'markup') {
    const className = resolve(['lc-markup'], node.style, node.animation)
    const classAttr = options.jsx ? 'className' : 'class'
    return [
      `${indent}<div ${classAttr}="${escapeAttr(className)}">`,
      `${indent}  <template shadowrootmode="open">`,
      `${indent}    <style>${node.css}</style>`,
      `${indent}    ${node.html}`,
      `${indent}  </template>`,
      `${indent}</div>`,
    ].join('\n')
  }

  const attrs = attributes(node, resolve, options)
  if (VOID_TAGS.has(node.tag)) return options.jsx ? `${indent}<${node.tag}${attrs} />` : `${indent}<${node.tag}${attrs}>`
  const open = `${indent}<${node.tag}${attrs}>`
  if (node.children.every((child) => child.type === 'text')) {
    const inline = node.children.map((child) => escapeText((child as { text: string }).text)).join('')
    return `${open}${inline}</${node.tag}>`
  }
  const children = node.children.map((child) => serialize(child, resolve, depth + 1, options)).join('\n')
  return `${open}\n${children}\n${indent}</${node.tag}>`
}

const block = (selector: string, decls: Decls) =>
  `${selector} {\n${Object.entries(decls)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n')}\n}`

export function emitHtmlCss(tree: ElementNode): { html: string; css: string } {
  const used = new Set<string>()
  const presets = new Set<AnimationPreset>()
  const rules: string[] = []
  const media = new Map<string, { maxWidth: number; minWidth?: number; blocks: string[] }>()

  const resolve: ClassResolver = (baseClasses, baseStyle, animation, responsive) => {
    const classes = animation ? [...baseClasses, ...animationClasses(animation)] : baseClasses
    const style = animation ? { ...baseStyle, ...animationVars(animation) } : baseStyle
    if (animation) presets.add(animation.preset)
    classes.forEach((name) => used.add(name))
    if (Object.keys(style).length === 0 && !responsive?.length) return classes.join(' ')
    const name = `lc-n${rules.length + 1}`
    // The extra .lc-root raises specificity so per-element styles beat base hover rules, like inline styles do.
    if (Object.keys(style).length) rules.push(block(`.lc-root .${name}`, style))
    for (const query of responsive ?? []) {
      if (Object.keys(query.style).length === 0) continue
      const key = `${query.minWidth ?? 0}:${query.maxWidth}`
      const bucket = media.get(key) ?? { maxWidth: query.maxWidth, minWidth: query.minWidth, blocks: [] }
      bucket.blocks.push(block(`.lc-root .${name}`, query.style))
      media.set(key, bucket)
    }
    return [...classes, name].join(' ')
  }

  const html = serialize(tree, resolve, 0)
  const base = Object.entries(CLASS_DEFS)
    .filter(([name]) => used.has(name))
    .flatMap(([name, def]) => [
      block(`.${name}`, def.base),
      ...(def.hover ? [block(`.${name}:hover`, def.hover)] : []),
      ...(def.focusVisible ? [block(`.${name}:focus-visible`, def.focusVisible)] : []),
    ])

  const reset = block('.lc-root,\n.lc-root *,\n.lc-root *::before,\n.lc-root *::after', { 'box-sizing': 'border-box' })
  const queries = [...media.values()]
    .sort((a, b) => b.maxWidth - a.maxWidth)
    .map((item) => `@media ${mediaQuery(item)} {\n${item.blocks.join('\n\n')}\n}`)
  const animations = presets.size ? [ANIMATION_RULES, keyframesCss(presets)] : []
  return { html, css: [reset, ...base, ...rules, ...queries, ...animations].join('\n\n') }
}

const arbitrary = (value: string) => value.trim().replace(/\s*,\s*/g, ',').replace(/\s+/g, '_')

const KEYWORDS: Record<string, Record<string, string>> = {
  display: { flex: 'flex', 'inline-flex': 'inline-flex', block: 'block', grid: 'grid', none: 'hidden' },
  position: { absolute: 'absolute', relative: 'relative' },
  'flex-direction': { column: 'flex-col', row: 'flex-row' },
  'flex-wrap': { wrap: 'flex-wrap' },
  'align-items': { center: 'items-center', 'flex-start': 'items-start', stretch: 'items-stretch' },
  'justify-content': { center: 'justify-center' },
  'align-self': { 'flex-start': 'self-start', stretch: 'self-stretch' },
  'text-align': { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' },
  'font-style': { italic: 'italic' },
  'text-transform': { uppercase: 'uppercase' },
  'white-space': { 'pre-line': 'whitespace-pre-line' },
  'text-decoration': { none: 'no-underline' },
  overflow: { hidden: 'overflow-hidden', visible: 'overflow-visible' },
  'object-fit': { cover: 'object-cover', contain: 'object-contain' },
  'transform-origin': { center: 'origin-center' },
  'border-style': { solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted', none: 'border-none' },
  'font-weight': { '300': 'font-light', '400': 'font-normal', '500': 'font-medium', '600': 'font-semibold', '700': 'font-bold', '800': 'font-extrabold' },
}

const PREFIXES: Record<string, string> = {
  gap: 'gap',
  left: 'left',
  top: 'top',
  'max-width': 'max-w',
  'min-height': 'min-h',
  'margin-top': 'mt',
  'margin-bottom': 'mb',
  'padding-top': 'pt',
  'padding-right': 'pr',
  'padding-bottom': 'pb',
  'padding-left': 'pl',
  'padding-inline': 'px',
  'line-height': 'leading',
  'letter-spacing': 'tracking',
  'border-width': 'border',
  'border-radius': 'rounded',
  'border-top-left-radius': 'rounded-tl',
  'border-top-right-radius': 'rounded-tr',
  'border-bottom-right-radius': 'rounded-br',
  'border-bottom-left-radius': 'rounded-bl',
  'box-shadow': 'shadow',
  opacity: 'opacity',
  'font-family': 'font',
}

/** One utility per declaration: named utilities where Tailwind has them, arbitrary values otherwise. */
function utility(property: string, value: string): string {
  const keyword = KEYWORDS[property]?.[value]
  if (keyword) return keyword
  const v = arbitrary(value)

  switch (property) {
    case 'width':
      return value === '100%' ? 'w-full' : `w-[${v}]`
    case 'height':
      return value === '100%' ? 'h-full' : value === 'auto' ? 'h-auto' : `h-[${v}]`
    case 'margin':
      return value === '0' ? 'm-0' : `m-[${v}]`
    case 'margin-inline':
      return value === 'auto' ? 'mx-auto' : `mx-[${v}]`
    case 'font-size':
      return `text-[length:${v}]`
    case 'color':
      return value === '#ffffff' ? 'text-white' : `text-[color:${v}]`
    case 'background':
      return value === 'transparent' ? 'bg-transparent' : `bg-[${v}]`
    case 'border-width':
      return value === '0' ? 'border-0' : `border-[length:${v}]`
    case 'border-top-width':
    case 'border-right-width':
    case 'border-bottom-width':
    case 'border-left-width':
      return `border-${property.split('-')[1][0]}-[length:${v}]`
    case 'border-color':
      return `border-[color:${v}]`
    case 'aspect-ratio':
      return `aspect-[${value.replace(/\s/g, '')}]`
    case 'transform': {
      const rotation = /^rotate\((-?[\d.]+)deg\)$/.exec(value)
      // `rotate` is its own CSS property in Tailwind, so a reset has to use it too.
      // `transform: none` would leave rotate-[25deg] in place on the smaller screen.
      if (rotation) return Number(rotation[1]) === 0 ? 'rotate-0' : `rotate-[${rotation[1]}deg]`
      if (value === 'none') return 'rotate-0'
      return `[transform:${v}]`
    }
    case 'opacity':
      return `opacity-[${v}]`
  }
  const prefix = PREFIXES[property]
  return prefix ? `${prefix}-[${v}]` : `[${property}:${v}]`
}

const utilities = (decls: Decls, variant = '') =>
  Object.entries(decls).map(([property, value]) => `${variant}${utility(property, value)}`)

const SUPPORTS_SCROLL = `supports-[animation-timeline:${SCROLL_TIMELINE.timeline}]:`

/** Arbitrary animate-[] utilities; the keyframes they name ship in a separate stylesheet. */
function animationUtilities(animation: BlockAnimation): string[] {
  const value = `animate-[${arbitrary(animationShorthand(animation))}]`
  switch (animation.trigger) {
    case 'hover':
      return [`hover:${value}`, 'motion-reduce:hover:animate-none']
    case 'scroll':
      return [
        value,
        `${SUPPORTS_SCROLL}[animation-timeline:${SCROLL_TIMELINE.timeline}]`,
        `${SUPPORTS_SCROLL}[animation-range:${arbitrary(SCROLL_TIMELINE.range)}]`,
        'motion-reduce:animate-none',
      ]
    default:
      return [value, 'motion-reduce:animate-none']
  }
}

export function emitTailwind(tree: ElementNode, options?: SerializeOptions): { html: string; css: string } {
  const presets = new Set<AnimationPreset>()
  const resolve: ClassResolver = (classes, style, animation, responsive) => {
    const base: Decls = {}
    const hover: Decls = {}
    const focus: Decls = {}
    for (const name of classes) {
      const def = CLASS_DEFS[name]
      if (!def) continue
      Object.assign(base, def.base)
      Object.assign(hover, def.hover)
      Object.assign(focus, def.focusVisible)
    }
    // Merging before conversion means each property gets one utility, so there is no class-order conflict.
    Object.assign(base, style)
    for (const property of Object.keys(style)) delete hover[property]
    if (animation) presets.add(animation.preset)
    const sized = (responsive ?? []).flatMap((query) => {
      if (Object.keys(query.style).length === 0) return []
      const min = query.minWidth ? `min-[${query.minWidth}px]:` : ''
      return utilities(query.style, `${min}max-[${query.maxWidth}px]:`)
    })
    return [
      ...utilities(base),
      ...utilities(hover, 'hover:'),
      ...utilities(focus, 'focus-visible:'),
      ...(animation ? animationUtilities(animation) : []),
      ...sized,
    ].join(' ')
  }
  const html = serialize(tree, resolve, 0, options)
  return { html, css: keyframesCss(presets) }
}
