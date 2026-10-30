import { describe, expect, it } from 'vitest'

import { animationProps, animationVars } from '@/puck/animation/animationCss'
import { sanitizeAnimation } from '@/puck/animation/sanitizeAnimation'
import { exportComposition } from '@/puck/export'
import { sanitizeComposition } from '@/puck/sanitize'

describe('sanitizeAnimation', () => {
  it('drops unknown presets and clamps or defaults every setting', () => {
    expect(sanitizeAnimation({ preset: 'explode' })).toBeUndefined()
    expect(sanitizeAnimation(null)).toBeUndefined()
    expect(
      sanitizeAnimation({ preset: 'slide-up', trigger: 'click', duration: 99_999, delay: -5, easing: 'url(x)', iterations: 50 }),
    ).toEqual({
      preset: 'slide-up',
      trigger: 'load',
      duration: 10_000,
      delay: 0,
      easing: 'ease-out',
      iterations: 10,
      loop: false,
      alternate: false,
    })
    expect(sanitizeAnimation({ preset: 'pulse' })?.loop).toBe(true)
  })

  it('ignores delay and repeats for scroll-linked animations', () => {
    const animation = sanitizeAnimation({ preset: 'pulse', trigger: 'scroll', delay: 400, loop: true, alternate: true })!
    expect(animationVars(animation)).toMatchObject({
      '--lc-anim-delay': '0ms',
      '--lc-anim-iterations': '1',
      '--lc-anim-direction': 'normal',
    })
  })

  it('renders nothing for bad data and classes plus variables for good data', () => {
    expect(animationProps({ preset: '"; background: red' })).toEqual({ className: '', style: {} })
    const props = animationProps({ preset: 'spin', trigger: 'hover', duration: 1200, easing: 'linear' })
    expect(props.className).toBe('lc-anim lc-anim--hover')
    expect(props.style).toMatchObject({ '--lc-anim-name': 'lc-spin', '--lc-anim-duration': '1200ms', '--lc-anim-iterations': 'infinite' })
  })

  it('keeps valid animations on blocks and canvas elements when saving', () => {
    const saved = sanitizeComposition({
      root: { props: {} },
      content: [
        { type: 'Heading', props: { id: 'a', text: 'Hi', animation: { preset: 'fade-in' } } },
        { type: 'Text', props: { id: 'b', text: 'x', animation: { preset: 'nope' } } },
        {
          type: 'FreeCanvas',
          props: {
            id: 'c',
            animation: { preset: 'zoom-in' },
            elements: [{ id: 'e', kind: 'shape', x: 0, y: 0, w: 10, h: 10, rotation: 0, content: {}, animation: { preset: 'float' } }],
          },
        },
      ],
    })
    const [heading, text, canvas] = saved.content as Array<{ props: Record<string, any> }>
    expect(heading.props.animation.preset).toBe('fade-in')
    expect('animation' in text.props).toBe(false)
    expect(canvas.props.animation.preset).toBe('zoom-in')
    expect(canvas.props.elements[0].animation.preset).toBe('float')
  })
})

const animated = {
  root: { props: {} },
  content: [
    { type: 'Heading', props: { id: 'h', text: 'Hello', level: 'h2', align: 'left', animation: { preset: 'slide-up', delay: 200 } } },
    {
      type: 'FreeCanvas',
      props: {
        id: 'c',
        artboard: { width: 960, height: 540 },
        grid: { show: false, snap: false, size: 8 },
        animation: { preset: 'fade-in', trigger: 'scroll' },
        elements: [
          { id: 'e', kind: 'shape', x: 0, y: 0, w: 100, h: 100, rotation: 30, content: {}, animation: { preset: 'spin', trigger: 'hover', easing: 'spring' } },
        ],
      },
    },
  ],
}

describe('animation export', () => {
  it('writes shared rules, per-element variables and only the keyframes in use', () => {
    const files = exportComposition(animated, 'html', 'Anim')
    const html = files.find((file) => file.id === 'snippet')!.content
    const css = files.find((file) => file.id === 'css')!.content

    expect(html).toMatch(/<h2 class="lc-heading lc-heading--h2 lc-anim lc-anim--load lc-n\d+">/)
    expect(html).toMatch(/class="lc-canvas lc-anim lc-anim--scroll lc-n\d+"/)
    expect(html).toMatch(/class="lc-el lc-n\d+">\n\s+<div class="lc-el-body lc-el-shape lc-anim lc-anim--hover lc-n\d+"/)
    expect(css).toContain('--lc-anim-name: lc-slide-up;')
    expect(css).toContain('--lc-anim-delay: 200ms;')
    expect(css).toContain('--lc-anim-easing: cubic-bezier(0.34, 1.56, 0.64, 1);')
    expect(css).toContain('animation-timeline: view();')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('@keyframes lc-spin')
    expect(css).not.toContain('@keyframes lc-pulse')
  })

  it('leaves animation CSS out when nothing is animated', () => {
    const files = exportComposition({ root: { props: {} }, content: [{ type: 'Text', props: { id: 't', text: 'x' } }] }, 'html', 'Still')
    expect(files.find((file) => file.id === 'css')!.content).not.toContain('lc-anim')
  })

  it('uses animate utilities in Tailwind and ships the keyframes beside them', () => {
    const files = exportComposition(animated, 'tailwind', 'Anim')
    const html = files.find((file) => file.id === 'snippet')!.content
    expect(html).toContain('animate-[lc-slide-up_700ms_ease-out_200ms_1_normal_backwards]')
    expect(html).toContain('supports-[animation-timeline:view()]:[animation-timeline:view()]')
    expect(html).toContain('supports-[animation-timeline:view()]:[animation-range:entry_10%_cover_30%]')
    expect(html).toContain('hover:animate-[lc-spin_4000ms_cubic-bezier(0.34,1.56,0.64,1)_0ms_infinite_normal_backwards]')
    expect(html).toContain('motion-reduce:animate-none')
    expect(html).toContain('rotate-[30deg]')
    expect(files.map((file) => file.id)).toEqual(['snippet', 'css', 'page'])
    expect(files.find((file) => file.id === 'css')!.content).toContain('@keyframes lc-fade-in')
    expect(files.find((file) => file.id === 'page')!.content).toContain('@keyframes lc-spin')
  })
})
