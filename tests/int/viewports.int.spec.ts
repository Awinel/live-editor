import { describe, expect, it } from 'vitest'

import { sanitizeCanvasProps } from '@/puck/canvas/sanitizeCanvas'
import { applyBox, canvasBoards, clearViewport, resolveBox, viewportOverrides } from '@/puck/canvas/viewports'
import type { FreeElement } from '@/puck/canvas/canvasTypes'
import { exportComposition } from '@/puck/export'

const element = (patch: Partial<FreeElement> = {}): FreeElement => ({
  id: 'e',
  kind: 'shape',
  x: 100,
  y: 50,
  w: 200,
  h: 80,
  rotation: 0,
  content: { shape: 'rect' },
  ...patch,
})

describe('canvas viewports', () => {
  const boards = canvasBoards({ artboard: { width: 960, height: 540 } })

  it('scales a large layout into medium and small until those sizes are edited', () => {
    const box = element()
    expect(boards.medium).toEqual({ width: 768, height: 540 })
    expect(boards.small).toEqual({ width: 480, height: 540 })
    expect(resolveBox(box, 'medium', boards)).toMatchObject({ x: 80, y: 50, w: 160, h: 80 })
    expect(resolveBox(box, 'small', boards).x).toBeLessThan(resolveBox(box, 'medium', boards).x)
  })

  it('keeps an edited size when the large layout changes underneath it', () => {
    const edited = applyBox(element(), 'medium', { x: 12, y: 24, w: 100, h: 40, rotation: 0 })
    expect(resolveBox(edited, 'medium', boards)).toMatchObject({ x: 12, y: 24, w: 100 })
    expect(resolveBox({ ...edited, x: 400 }, 'medium', boards)).toMatchObject({ x: 12 })
    expect(clearViewport([edited], 'medium')[0].responsive).toBeUndefined()
  })

  it('sanitizes viewport frames and drops a bad override', () => {
    const props = sanitizeCanvasProps({
      artboard: { width: 960, height: 540 },
      viewports: { medium: { width: 5000, height: 600 }, small: { width: 900, height: 700 } },
      elements: [{ id: 'e', kind: 'shape', x: 0, y: 0, w: 40, h: 40, content: { shape: 'rect' }, responsive: { small: { hidden: true } } }],
    })
    expect(props.viewports?.medium?.width).toBeLessThanOrEqual(960)
    expect(props.viewports?.small?.width).toBeLessThanOrEqual(props.viewports?.medium?.width ?? 960)
    expect(props.elements[0].responsive).toBeUndefined()
  })

  it('exports medium and small layouts as media queries', () => {
    const css = exportComposition(
      {
        root: { props: {} },
        content: [
          {
            type: 'FreeCanvas',
            props: {
              id: 'c',
              artboard: { width: 960, height: 540 },
              grid: { show: false, snap: false, size: 8 },
              elements: [
                applyBox(element({ id: 'star', content: { shape: 'star' } }), 'small', {
                  x: 16,
                  y: 20,
                  w: 80,
                  h: 80,
                  rotation: 0,
                  hidden: true,
                }),
              ],
            },
          },
        ],
      },
      'html',
      'Sizes',
    ).find((file) => file.id === 'css')!.content

    const medium = css.indexOf('@media (min-width: 481px) and (max-width: 768px)')
    const small = css.indexOf('@media (max-width: 480px)')
    expect(medium).toBeGreaterThan(-1)
    expect(small).toBeGreaterThan(medium)
    expect(css.slice(small)).toContain('display: none;')
    expect(css.slice(0, small)).not.toContain('display: none;')
    expect(viewportOverrides({ artboard: { width: 960, height: 540 }, elements: [element()] }).length).toBeGreaterThan(0)
  })
})
