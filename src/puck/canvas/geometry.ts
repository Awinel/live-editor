import type { Artboard } from './canvasTypes'

export type Box = { x: number; y: number; w: number; h: number }
export type Guides = { x: number[]; y: number[] }

const radians = (degrees: number) => (degrees * Math.PI) / 180
const roundGrid = (value: number, grid: number) => Math.round(value / grid) * grid

function snapAxis(
  start: number,
  size: number,
  lines: number[],
  threshold: number,
): { value: number; hit: boolean } {
  let best: { distance: number; value: number } | null = null
  for (const line of lines) {
    for (const offset of [0, size / 2, size]) {
      const distance = Math.abs(line - (start + offset))
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { distance, value: line - offset }
      }
    }
  }
  return best ? { value: best.value, hit: true } : { value: start, hit: false }
}

const touching = (lines: number[], start: number, size: number) =>
  [...new Set(lines)].filter((line) =>
    [start, start + size / 2, start + size].some((edge) => Math.abs(edge - line) < 0.5),
  )

/** Grid snapping first, then edge and center guides against the artboard and other elements win when close. */
export function snapMove(
  box: Box,
  others: Box[],
  artboard: Artboard,
  options: { grid: number; threshold: number },
): { x: number; y: number; guides: Guides } {
  let x = options.grid ? roundGrid(box.x, options.grid) : box.x
  let y = options.grid ? roundGrid(box.y, options.grid) : box.y
  if (!options.threshold) return { x: Math.round(x), y: Math.round(y), guides: { x: [], y: [] } }

  const linesX = [0, artboard.width / 2, artboard.width, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])]
  const linesY = [0, artboard.height / 2, artboard.height, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])]

  const snappedX = snapAxis(box.x, box.w, linesX, options.threshold)
  const snappedY = snapAxis(box.y, box.h, linesY, options.threshold)
  if (snappedX.hit) x = snappedX.value
  if (snappedY.hit) y = snappedY.value

  return {
    x: Math.round(x),
    y: Math.round(y),
    guides: {
      x: snappedX.hit ? touching(linesX, x, box.w) : [],
      y: snappedY.hit ? touching(linesY, y, box.h) : [],
    },
  }
}

/**
 * Resizes from a handle (hx, hy are -1, 0 or 1) while the opposite edge stays put,
 * working in the element's rotated frame so rotated elements resize naturally.
 */
export function resizeBox(
  start: Box & { rotation: number },
  hx: number,
  hy: number,
  dx: number,
  dy: number,
  options: { keepRatio: boolean; grid: number; min: number },
): Box {
  const angle = radians(start.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const localX = dx * cos + dy * sin
  const localY = -dx * sin + dy * cos

  let w = hx ? start.w + hx * localX : start.w
  let h = hy ? start.h + hy * localY : start.h
  if (options.keepRatio && hx && hy) {
    const ratio = start.w / start.h
    if (Math.abs(w / start.w) > Math.abs(h / start.h)) h = w / ratio
    else w = h * ratio
  }
  w = Math.max(options.min, w)
  h = Math.max(options.min, h)

  const shiftX = (hx * (w - start.w)) / 2
  const shiftY = (hy * (h - start.h)) / 2
  const centerX = start.x + start.w / 2 + shiftX * cos - shiftY * sin
  const centerY = start.y + start.h / 2 + shiftX * sin + shiftY * cos
  const box = { x: centerX - w / 2, y: centerY - h / 2, w, h }

  const grid = options.grid
  if (grid && start.rotation === 0 && !options.keepRatio) {
    if (hx === 1) box.w = Math.max(options.min, roundGrid(box.x + box.w, grid) - box.x)
    if (hx === -1) {
      const right = box.x + box.w
      box.x = roundGrid(box.x, grid)
      box.w = Math.max(options.min, right - box.x)
    }
    if (hy === 1) box.h = Math.max(options.min, roundGrid(box.y + box.h, grid) - box.y)
    if (hy === -1) {
      const bottom = box.y + box.h
      box.y = roundGrid(box.y, grid)
      box.h = Math.max(options.min, bottom - box.y)
    }
  }

  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    w: Math.round(box.w),
    h: Math.round(box.h),
  }
}

/** Angle so that the handle above the element follows the pointer; snaps to `step` or near right angles. */
export function rotationFromPointer(
  center: { x: number; y: number },
  pointer: { x: number; y: number },
  step: number,
): number {
  let degrees = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI + 90
  if (degrees > 180) degrees -= 360
  if (step) return Math.round(degrees / step) * step
  const nearest = Math.round(degrees / 90) * 90
  return Math.abs(degrees - nearest) < 4 ? nearest : Math.round(degrees)
}
