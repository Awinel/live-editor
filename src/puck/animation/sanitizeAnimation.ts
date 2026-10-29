import { clampNumber } from '../style/sanitizeStyle'
import {
  ANIMATION_EASINGS,
  ANIMATION_LIMITS,
  ANIMATION_PRESETS,
  ANIMATION_TRIGGERS,
  defaultAnimation,
  type AnimationEasing,
  type AnimationPreset,
  type AnimationTrigger,
  type BlockAnimation,
} from './animationTypes'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Returns undefined when there is no valid preset, so "no animation" is never stored. */
export function sanitizeAnimation(value: unknown): BlockAnimation | undefined {
  if (!isRecord(value) || !ANIMATION_PRESETS.includes(value.preset as AnimationPreset)) return undefined
  const fallback = defaultAnimation(value.preset as AnimationPreset)
  const round = (input: unknown, limits: [number, number], or: number) => {
    const number = clampNumber(input, limits)
    return number === undefined ? or : Math.round(number)
  }

  return {
    preset: fallback.preset,
    trigger: ANIMATION_TRIGGERS.includes(value.trigger as AnimationTrigger)
      ? (value.trigger as AnimationTrigger)
      : fallback.trigger,
    duration: round(value.duration, ANIMATION_LIMITS.duration, fallback.duration),
    delay: round(value.delay, ANIMATION_LIMITS.delay, fallback.delay),
    easing: ANIMATION_EASINGS.includes(value.easing as AnimationEasing)
      ? (value.easing as AnimationEasing)
      : fallback.easing,
    iterations: round(value.iterations, ANIMATION_LIMITS.iterations, fallback.iterations),
    loop: typeof value.loop === 'boolean' ? value.loop : fallback.loop,
    alternate: value.alternate === true,
  }
}
