import { describe, expect, it } from 'vitest'

import { shapeStyle } from '@/puck/canvas/shapes'
import { exportComposition } from '@/puck/export'
import { sanitizeStyle } from '@/puck/style/sanitizeStyle'
import { colorWithAlpha } from '@/puck/style/styleTypes'
import { containerUnit, toStyle } from '@/puck/style/toStyle'

describe('per-side borders and per-corner radius', () => {
  it('writes longhands with the all-sides width as fallback', () => {
    expect(toStyle({ borderWidth: 2, borderTopWidth: 6, borderColor: '#9a031e', borderStyle: 'dashed' })).toEqual({
      borderTopWidth: '6px',
      borderTopStyle: 'dashed',
      borderRightWidth: '2px',
      borderRightStyle: 'dashed',
      borderBottomWidth: '2px',
      borderBottomStyle: 'dashed',
      borderLeftWidth: '2px',
      borderLeftStyle: 'dashed',
      borderColor: '#9a031e',
    })
    expect(toStyle({ borderTopWidth: 0, borderLeftWidth: 0 })).toEqual({
      borderTopWidth: '0px',
      borderTopStyle: 'none',
      borderLeftWidth: '0px',
      borderLeftStyle: 'none',
    })
  })

  it('leaves unset sides alone so a block keeps its own border there', () => {
    expect(toStyle({ borderBottomWidth: 4 })).toEqual({ borderBottomWidth: '4px', borderBottomStyle: 'solid' })
  })

  it('keeps the shorthand when no side is set', () => {
    expect(toStyle({ borderWidth: 3, borderColor: '#fb8b24' })).toEqual({ border: '3px solid #fb8b24' })
  })

  it('writes each corner, falling back to the shared radius', () => {
    expect(toStyle({ radius: 8, radiusTopLeft: 32, radiusBottomRight: 0 })).toEqual({
      borderTopLeftRadius: '32px',
      borderTopRightRadius: '8px',
      borderBottomRightRadius: '0px',
      borderBottomLeftRadius: '8px',
    })
    expect(toStyle({ radiusTopRight: 99_999 }).borderTopRightRadius).toBe('999px')
  })
})

describe('custom shadows', () => {
  it('combines a color and opacity into rgba', () => {
    expect(colorWithAlpha('#0f4c5c', 50)).toBe('rgba(15, 76, 92, 0.5)')
    expect(colorWithAlpha('#fff', 100)).toBe('rgba(255, 255, 255, 1)')
    expect(colorWithAlpha('rgba(10, 20, 30, 0.5)', 50)).toBe('rgba(10, 20, 30, 0.25)')
    expect(colorWithAlpha('red; x', 50)).toBe('transparent')
  })

  it('sanitizes layers: clamps numbers, replaces bad colors and keeps at most four', () => {
    const style = sanitizeStyle({
      shadows: [
        { x: 999, y: -5, blur: -3, spread: 4, color: 'url(evil)', alpha: 300, inset: 'yes' },
        ...Array.from({ length: 6 }, () => ({ x: 1, y: 1, blur: 1, spread: 0, color: '#000', alpha: 10, inset: true })),
      ],
    })
    expect(style?.shadows).toHaveLength(4)
    expect(style?.shadows?.[0]).toEqual({ x: 200, y: -5, blur: 0, spread: 4, color: '#0f4c5c', alpha: 100 })
    expect(style?.shadows?.[1].inset).toBe(true)
  })

  it('renders layers in order, scaled by the length unit, and overrides the preset', () => {
    const css = toStyle({
      shadow: 'lg',
      shadows: [
        { x: 0, y: 4, blur: 12, spread: 0, color: '#000000', alpha: 25 },
        { x: 0, y: 0, blur: 0, spread: 2, color: '#fb8b24', alpha: 100, inset: true },
      ],
    })
    expect(css.boxShadow).toBe('0px 4px 12px 0px rgba(0, 0, 0, 0.25), inset 0px 0px 0px 2px rgba(251, 139, 36, 1)')
    expect(toStyle({ shadows: [{ x: 0, y: 96, blur: 0, spread: 0, color: '#000', alpha: 50 }] }, containerUnit(960)).boxShadow).toBe(
      '0cqw 10cqw 0cqw 0cqw rgba(0, 0, 0, 0.5)',
    )
    expect(toStyle({ shadow: 'md' }).boxShadow).toBe('0px 8px 20px 0px rgba(15, 76, 92, 0.18)')
  })
})

describe('export', () => {
  const composition = {
    root: { props: {} },
    content: [
      {
        type: 'Button',
        props: {
          id: 'b',
          label: 'Go',
          href: '#',
          variant: 'solid',
          style: {
            borderBottomWidth: 4,
            borderColor: '#5f0f40',
            radiusTopLeft: 16,
            shadows: [{ x: 0, y: 6, blur: 0, spread: 0, color: '#5f0f40', alpha: 100 }],
          },
        },
      },
      {
        type: 'FreeCanvas',
        props: {
          id: 'c',
          artboard: { width: 960, height: 540 },
          grid: { show: false, snap: false, size: 8 },
          elements: [
            { id: 'e', kind: 'shape', x: 0, y: 0, w: 96, h: 96, rotation: 0, content: { shape: 'ellipse' }, style: { radiusTopLeft: 20 } },
          ],
        },
      },
    ],
  }

  it('writes longhands in CSS and keeps ellipses round', () => {
    const css = exportComposition(composition, 'html', 'x').find((file) => file.id === 'css')!.content
    expect(css).toContain('border-bottom-width: 4px;')
    expect(css).toContain('border-top-left-radius: 16px;')
    expect(css).toContain('box-shadow: 0px 6px 0px 0px rgba(95, 15, 64, 1);')
    expect(css).toContain('border-radius: 50%;')
    expect(css).not.toContain('border-top-left-radius: 2.0833cqw')
  })

  it('clips polygon shapes and lets their shadow follow the outline', () => {
    expect(shapeStyle('rect', { borderRadius: '8px' })).toEqual({ borderRadius: '8px' })
    expect(shapeStyle('ellipse', { borderRadius: '8px', background: '#fff' })).toEqual({
      background: '#fff',
      borderRadius: '50%',
    })
    const star = shapeStyle('star', {
      background: '#fb8b24',
      borderRadius: '12px',
      boxShadow: '0px 8px 20px 0px rgba(15, 76, 92, 0.18)',
    })
    expect(star.clipPath).toContain('polygon(')
    expect(star.filter).toBe('drop-shadow(0px 8px 20px rgba(15, 76, 92, 0.18))')
    expect(star).not.toHaveProperty('borderRadius')
    expect(star).not.toHaveProperty('boxShadow')
  })

  it('exports a triangle as a clip path', () => {
    const files = exportComposition(
      {
        content: [
          {
            type: 'FreeCanvas',
            props: {
              id: 'c',
              artboard: { width: 400, height: 400 },
              grid: { show: false, snap: false, size: 8 },
              elements: [
                {
                  id: 't',
                  kind: 'shape',
                  x: 0,
                  y: 0,
                  w: 100,
                  h: 100,
                  rotation: 0,
                  content: { shape: 'triangle' },
                  style: { background: '#fb8b24', radius: 8 },
                },
              ],
            },
          },
        ],
        root: { props: {} },
      },
      'html',
      'x',
    )
    const css = files.find((file) => file.id === 'css')!.content
    expect(css).toContain('clip-path: polygon(50% 0%, 0% 100%, 100% 100%);')
    expect(css).not.toContain('border-radius')

    const snippet = exportComposition(
      {
        content: [
          {
            type: 'FreeCanvas',
            props: {
              id: 'c',
              artboard: { width: 400, height: 400 },
              grid: { show: false, snap: false, size: 8 },
              elements: [
                {
                  id: 't',
                  kind: 'shape',
                  x: 0,
                  y: 0,
                  w: 100,
                  h: 100,
                  rotation: 0,
                  content: { shape: 'triangle' },
                  style: { background: '#fb8b24' },
                },
              ],
            },
          },
        ],
        root: { props: {} },
      },
      'tailwind',
      'x',
    ).find((file) => file.id === 'snippet')!.content
    expect(snippet).toContain('[clip-path:polygon(50%_0%,0%_100%,100%_100%)]')
  })

  it('uses side and corner utilities in Tailwind', () => {
    const html = exportComposition(composition, 'tailwind', 'x').find((file) => file.id === 'snippet')!.content
    expect(html).toContain('border-b-[length:4px]')
    expect(html).toContain('[border-bottom-style:solid]')
    expect(html).not.toContain('border-t-[')
    expect(html).toContain('rounded-tl-[16px]')
    expect(html).toContain('shadow-[0px_6px_0px_0px_rgba(95,15,64,1)]')
  })
})
