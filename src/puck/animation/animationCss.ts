import type { CSSProperties } from 'react'

import {
  ANIMATION_PRESETS,
  EASING_VALUES,
  KEYFRAMES,
  type AnimationPreset,
  type BlockAnimation,
} from './animationTypes'
import { sanitizeAnimation } from './sanitizeAnimation'

const ANIMATION_VALUE =
  'var(--lc-anim-name) var(--lc-anim-duration) var(--lc-anim-easing) var(--lc-anim-delay) var(--lc-anim-iterations) var(--lc-anim-direction) backwards'

const SCROLL_RANGE = 'entry 10% cover 30%'

/** Scroll-linked animations follow the scroll position, so delay and repeats do not apply to them. */
export function animationVars(animation: BlockAnimation): Record<string, string> {
  const scroll = animation.trigger === 'scroll'
  return {
    '--lc-anim-name': `lc-${animation.preset}`,
    '--lc-anim-duration': `${animation.duration}ms`,
    '--lc-anim-easing': EASING_VALUES[animation.easing],
    '--lc-anim-delay': scroll ? '0ms' : `${animation.delay}ms`,
    '--lc-anim-iterations': scroll ? '1' : animation.loop ? 'infinite' : String(animation.iterations),
    '--lc-anim-direction': animation.alternate && !scroll ? 'alternate' : 'normal',
  }
}

export const animationClasses = (animation: BlockAnimation) => ['lc-anim', `lc-anim--${animation.trigger}`]

/** The `animation` shorthand with every value filled in, for outputs that cannot use the shared rules. */
export function animationShorthand(animation: BlockAnimation): string {
  const vars = animationVars(animation)
  return [
    vars['--lc-anim-name'],
    vars['--lc-anim-duration'],
    vars['--lc-anim-easing'],
    vars['--lc-anim-delay'],
    vars['--lc-anim-iterations'],
    vars['--lc-anim-direction'],
    'backwards',
  ].join(' ')
}

export const SCROLL_TIMELINE = { timeline: 'view()', range: SCROLL_RANGE }

export const keyframesCss = (presets: Iterable<AnimationPreset>) =>
  [...new Set(presets)].map((preset) => `@keyframes lc-${preset} {\n  ${KEYFRAMES[preset]}\n}`).join('\n\n')

/** Shared rules; each animated element only sets the --lc-anim-* variables. */
export const ANIMATION_RULES = [
  `.lc-anim--load,\n.lc-anim--scroll,\n.lc-anim--hover:hover {\n  animation: ${ANIMATION_VALUE};\n}`,
  `@supports (animation-timeline: view()) {\n  .lc-anim--scroll {\n    animation-timeline: ${SCROLL_TIMELINE.timeline};\n    animation-range: ${SCROLL_RANGE};\n  }\n}`,
  `@media (prefers-reduced-motion: reduce) {\n  .lc-anim {\n    animation: none !important;\n  }\n}`,
].join('\n\n')

/** In the editor animations hold still so dragging stays accurate, and play only while previewing. */
const EDITOR_RULES = [
  '.lc-root--editing .lc-anim {\n  animation: none !important;\n}',
  `[data-lc-anim-preview] .lc-root--editing .lc-anim {\n  animation: ${ANIMATION_VALUE} !important;\n}`,
].join('\n\n')

export const SITE_ANIMATION_CSS = `${ANIMATION_RULES}\n\n${keyframesCss(ANIMATION_PRESETS)}`
export const EDITOR_ANIMATION_CSS = `${SITE_ANIMATION_CSS}\n\n${EDITOR_RULES}`

/** Validates again on render, like toStyle, so bad stored data renders without animation. */
export function animationProps(raw: unknown): { className: string; style: CSSProperties } {
  const animation = sanitizeAnimation(raw)
  if (!animation) return { className: '', style: {} }
  return { className: animationClasses(animation).join(' '), style: animationVars(animation) as CSSProperties }
}

export const withClass = (base: string, extra: string) => (extra ? `${base} ${extra}` : base)
