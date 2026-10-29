export const ENTRANCE_PRESETS = [
  'fade-in',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'zoom-out',
  'flip-in',
  'rotate-in',
  'bounce-in',
  'blur-in',
] as const

export const LOOP_PRESETS = ['pulse', 'float', 'bounce', 'spin', 'wiggle', 'shake', 'heartbeat'] as const

export const ANIMATION_PRESETS = [...ENTRANCE_PRESETS, ...LOOP_PRESETS] as const
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number]

export const ANIMATION_TRIGGERS = ['load', 'scroll', 'hover'] as const
export type AnimationTrigger = (typeof ANIMATION_TRIGGERS)[number]

export const ANIMATION_EASINGS = ['ease', 'ease-out', 'ease-in', 'ease-in-out', 'linear', 'spring'] as const
export type AnimationEasing = (typeof ANIMATION_EASINGS)[number]

export type BlockAnimation = {
  preset: AnimationPreset
  trigger: AnimationTrigger
  /** Milliseconds. */
  duration: number
  /** Milliseconds. */
  delay: number
  easing: AnimationEasing
  iterations: number
  loop: boolean
  alternate: boolean
}

export const ANIMATION_LIMITS = {
  duration: [100, 10_000] as [number, number],
  delay: [0, 10_000] as [number, number],
  iterations: [1, 10] as [number, number],
}

export const PRESET_LABELS: Record<AnimationPreset, string> = {
  'fade-in': 'Fade in',
  'slide-up': 'Slide up',
  'slide-down': 'Slide down',
  'slide-left': 'Slide in from right',
  'slide-right': 'Slide in from left',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'flip-in': 'Flip in',
  'rotate-in': 'Rotate in',
  'bounce-in': 'Bounce in',
  'blur-in': 'Blur in',
  pulse: 'Pulse',
  float: 'Float',
  bounce: 'Bounce',
  spin: 'Spin',
  wiggle: 'Wiggle',
  shake: 'Shake',
  heartbeat: 'Heartbeat',
}

export const TRIGGER_LABELS: Record<AnimationTrigger, string> = {
  load: 'When the page loads',
  scroll: 'When scrolled into view',
  hover: 'On hover',
}

export const EASING_LABELS: Record<AnimationEasing, string> = {
  ease: 'Smooth',
  'ease-out': 'Slow down at the end',
  'ease-in': 'Speed up',
  'ease-in-out': 'Slow at both ends',
  linear: 'Constant speed',
  spring: 'Springy overshoot',
}

export const EASING_VALUES: Record<AnimationEasing, string> = {
  ease: 'ease',
  'ease-out': 'ease-out',
  'ease-in': 'ease-in',
  'ease-in-out': 'ease-in-out',
  linear: 'linear',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

export const isLoopPreset = (preset: AnimationPreset) => (LOOP_PRESETS as readonly string[]).includes(preset)

export function defaultAnimation(preset: AnimationPreset): BlockAnimation {
  if (isLoopPreset(preset)) {
    return {
      preset,
      trigger: 'load',
      duration: preset === 'spin' ? 4000 : preset === 'shake' || preset === 'wiggle' ? 800 : 2000,
      delay: 0,
      easing: preset === 'spin' ? 'linear' : 'ease-in-out',
      iterations: 1,
      loop: true,
      alternate: false,
    }
  }
  return {
    preset,
    trigger: 'load',
    duration: preset === 'bounce-in' ? 900 : 700,
    delay: 0,
    easing: preset === 'bounce-in' ? 'ease' : 'ease-out',
    iterations: 1,
    loop: false,
    alternate: false,
  }
}

/** Keyframe bodies; entrance presets only describe the start so they always end on the element's own styles. */
export const KEYFRAMES: Record<AnimationPreset, string> = {
  'fade-in': 'from { opacity: 0; }',
  'slide-up': 'from { opacity: 0; transform: translateY(32px); }',
  'slide-down': 'from { opacity: 0; transform: translateY(-32px); }',
  'slide-left': 'from { opacity: 0; transform: translateX(32px); }',
  'slide-right': 'from { opacity: 0; transform: translateX(-32px); }',
  'zoom-in': 'from { opacity: 0; transform: scale(0.8); }',
  'zoom-out': 'from { opacity: 0; transform: scale(1.2); }',
  'flip-in': 'from { opacity: 0; transform: perspective(600px) rotateX(-70deg); }',
  'rotate-in': 'from { opacity: 0; transform: rotate(-12deg) scale(0.9); }',
  'bounce-in':
    '0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.06); } 80% { transform: scale(0.97); } 100% { transform: scale(1); }',
  'blur-in': 'from { opacity: 0; filter: blur(12px); }',
  pulse: '0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); }',
  float: '0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); }',
  bounce:
    '0%, 100% { transform: translateY(0); } 30% { transform: translateY(-18px); } 50% { transform: translateY(0); } 65% { transform: translateY(-7px); } 80% { transform: translateY(0); }',
  spin: 'from { transform: rotate(0deg); } to { transform: rotate(360deg); }',
  wiggle: '0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); }',
  shake:
    '0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); }',
  heartbeat:
    '0%, 100% { transform: scale(1); } 15% { transform: scale(1.12); } 30% { transform: scale(1); } 45% { transform: scale(1.08); } 60% { transform: scale(1); }',
}
