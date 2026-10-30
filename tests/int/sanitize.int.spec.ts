import { describe, expect, it } from 'vitest'

import { CANVAS_LIMITS } from '@/puck/canvas/canvasTypes'
import { resizeBox, rotationFromPointer, snapMove } from '@/puck/canvas/geometry'
import { sanitizeCanvasProps } from '@/puck/canvas/sanitizeCanvas'
import { sanitizeComposition } from '@/puck/sanitize'
import { sanitizeStyle } from '@/puck/style/sanitizeStyle'
import { containerUnit, toStyle } from '@/puck/style/toStyle'

describe('sanitizeStyle', () => {
  it('keeps valid values and drops hostile colors', () => {
    expect(
      sanitizeStyle({
        color: '#9A031E',
        background: 'rgba(15, 76, 92, 0.5)',
        borderColor: 'red; background: url(javascript:alert(1))',
      }),
    ).toEqual({ color: '#9A031E', background: 'rgba(15, 76, 92, 0.5)' })

    expect(sanitizeStyle({ background: 'url(https://evil.test/x.png)' })).toBeUndefined()
    expect(sanitizeStyle({ color: 'expression(alert(1))' })).toBeUndefined()
  })

  it('clamps numbers, checks enums and ignores unknown keys', () => {
    expect(
      sanitizeStyle({
        fontSize: 99999,
        paddingTop: -40,
        opacity: '50',
        lineHeight: 'tall',
        shadow: 'huge',
        textAlign: 'center',
        italic: 'yes',
        uppercase: true,
        position: 'fixed',
      }),
    ).toEqual({ fontSize: 240, paddingTop: 0, opacity: 50, textAlign: 'center', uppercase: true })
  })

  it('returns undefined for empty or invalid input', () => {
    expect(sanitizeStyle(null)).toBeUndefined()
    expect(sanitizeStyle(['color'])).toBeUndefined()
    expect(sanitizeStyle({})).toBeUndefined()
  })
})

describe('toStyle', () => {
  it('never emits values that fail validation', () => {
    expect(toStyle({ color: 'red;}body{display:none', fontSize: 20 })).toEqual({ fontSize: '20px' })
  })

  it('converts lengths to container units for the canvas', () => {
    const css = toStyle({ fontSize: 48, radius: 12 }, containerUnit(960))
    expect(css.fontSize).toBe('5cqw')
    expect(css.borderRadius).toBe('1.25cqw')
  })
})

describe('sanitizeCanvasProps', () => {
  it('fills defaults and clamps the artboard and grid', () => {
    const props = sanitizeCanvasProps({ artboard: { width: 99999, height: 'x' }, grid: { size: 7, show: 'yes' } })
    expect(props.artboard).toEqual({ width: CANVAS_LIMITS.artboardWidth[1], height: 540 })
    expect(props.grid).toEqual({ show: false, snap: false, size: 8 })
    expect(props.elements).toEqual([])
  })

  it('filters unknown kinds, caps the element count and cleans content', () => {
    const element = {
      id: 'a"><script>',
      kind: 'text',
      x: -5000,
      y: 99999,
      w: 120,
      h: 40,
      rotation: 720,
      content: { text: 'x'.repeat(5000), src: 'javascript:alert(1)' },
      style: { color: 'url(x)', fontSize: 20 },
      onClick: 'alert(1)',
    }
    const props = sanitizeCanvasProps({
      artboard: { width: 960, height: 540 },
      elements: [{ kind: 'iframe', src: 'https://evil.test' }, ...Array.from({ length: 80 }, () => element)],
    })

    expect(props.elements).toHaveLength(CANVAS_LIMITS.maxElements - 1)
    const [first] = props.elements
    expect(first.id).toBe('ascript')
    expect(first).toMatchObject({ kind: 'text', x: -120, y: 540, rotation: 180 })
    expect(first.content).toEqual({ text: 'x'.repeat(CANVAS_LIMITS.maxText) })
    expect(first.style).toEqual({ fontSize: 20 })
    expect(first).not.toHaveProperty('onClick')
  })

  it('keeps known shapes and falls back to a rectangle', () => {
    const props = sanitizeCanvasProps({
      artboard: { width: 400, height: 400 },
      elements: [
        { id: 'a', kind: 'shape', x: 0, y: 0, w: 40, h: 40, content: { shape: 'pentagon' } },
        { id: 'b', kind: 'shape', x: 0, y: 0, w: 40, h: 40, content: { shape: 'blob' } },
      ],
    })
    expect(props.elements.map((element) => element.content.shape)).toEqual(['pentagon', 'rect'])
  })

  it('keeps input content and drops an unsafe field name', () => {
    const props = sanitizeCanvasProps({
      artboard: { width: 400, height: 400 },
      elements: [
        {
          id: 'field',
          kind: 'input',
          x: 0,
          y: 0,
          w: 200,
          h: 64,
          content: { label: 'Email', text: 'ada@example.com', placeholder: 'you@example.com', name: 'onfocus=alert(1)', inputType: 'email' },
        },
        {
          id: 'star',
          kind: 'shape',
          x: 0,
          y: 0,
          w: 80,
          h: 80,
          content: { shape: 'star', text: 'Go' },
        },
      ],
    })
    expect(props.elements[0].content).toEqual({
      label: 'Email',
      text: 'ada@example.com',
      placeholder: 'you@example.com',
      inputType: 'email',
    })
    expect(props.elements[1].content).toEqual({ shape: 'star', text: 'Go' })
  })
})

describe('sanitizeComposition', () => {
  it('sanitizes styles and canvases inside slots and leaves older blocks unchanged', () => {
    const result = sanitizeComposition({
      content: [
        { type: 'Heading', props: { id: 'h', text: 'Hi', level: 'h2', align: 'left' } },
        {
          type: 'Stack',
          props: {
            id: 's',
            style: { background: 'url(x)', paddingTop: 16 },
            items: [
              {
                type: 'FreeCanvas',
                props: {
                  id: 'c',
                  artboard: { width: 600, height: 600 },
                  grid: { show: true, snap: true, size: 16 },
                  elements: [{ id: 'e1', kind: 'button', x: 10, y: 10, w: 100, h: 40, content: { text: 'Go' } }],
                },
              },
            ],
          },
        },
        { type: 'Script', props: { src: 'x' } },
      ],
      root: { props: {} },
    })

    expect(result.content).toHaveLength(2)
    expect(result.content[0]).toEqual({ type: 'Heading', props: { id: 'h', text: 'Hi', level: 'h2', align: 'left' } })
    const stack = result.content[1].props as Record<string, unknown>
    expect(stack.style).toEqual({ paddingTop: 16 })
    const canvas = (stack.items as Array<{ props: Record<string, unknown> }>)[0].props
    expect(canvas.elements).toEqual([
      {
        id: 'e1',
        kind: 'button',
        x: 10,
        y: 10,
        w: 100,
        h: 40,
        rotation: 0,
        content: { text: 'Go', href: '#' },
        style: undefined,
      },
    ])
  })
})

describe('canvas geometry', () => {
  const artboard = { width: 960, height: 540 }

  it('snaps to the grid and to nearby element edges', () => {
    expect(snapMove({ x: 13, y: 21, w: 100, h: 50 }, [], artboard, { grid: 8, threshold: 0 })).toMatchObject({
      x: 16,
      y: 24,
    })
    const snapped = snapMove({ x: 203, y: 300, w: 100, h: 50 }, [{ x: 200, y: 0, w: 50, h: 50 }], artboard, {
      grid: 0,
      threshold: 6,
    })
    expect(snapped.x).toBe(200)
    expect(snapped.guides.x).toContain(200)
  })

  it('keeps the opposite edge fixed while resizing', () => {
    const start = { x: 100, y: 100, w: 200, h: 100, rotation: 0 }
    expect(resizeBox(start, -1, 0, -50, 0, { keepRatio: false, grid: 0, min: 8 })).toEqual({
      x: 50,
      y: 100,
      w: 250,
      h: 100,
    })
    expect(resizeBox(start, 1, 1, 37, 0, { keepRatio: false, grid: 8, min: 8 })).toEqual({
      x: 100,
      y: 100,
      w: 236,
      h: 100,
    })
  })

  it('rotates in steps and settles on right angles', () => {
    expect(rotationFromPointer({ x: 0, y: 0 }, { x: 3, y: -100 }, 0)).toBe(0)
    expect(rotationFromPointer({ x: 0, y: 0 }, { x: 100, y: -60 }, 15)).toBe(60)
  })
})
