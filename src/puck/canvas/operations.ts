import { CANVAS_LIMITS, newElementId, type FreeElement } from './canvasTypes'

export const updateElement = (elements: FreeElement[], id: string, patch: Partial<FreeElement>) =>
  elements.map((element) => (element.id === id ? { ...element, ...patch } : element))

export const removeElement = (elements: FreeElement[], id: string) =>
  elements.filter((element) => element.id !== id)

export function duplicateElement(
  elements: FreeElement[],
  id: string,
): { elements: FreeElement[]; id: string | null } {
  const source = elements.find((element) => element.id === id)
  if (!source || elements.length >= CANVAS_LIMITS.maxElements) return { elements, id: null }
  const copy = { ...structuredClone(source), id: newElementId(), x: source.x + 16, y: source.y + 16 }
  if (copy.responsive?.medium) copy.responsive.medium = { ...copy.responsive.medium, x: copy.responsive.medium.x + 16, y: copy.responsive.medium.y + 16 }
  if (copy.responsive?.small) copy.responsive.small = { ...copy.responsive.small, x: copy.responsive.small.x + 16, y: copy.responsive.small.y + 16 }
  const index = elements.indexOf(source)
  return { elements: [...elements.slice(0, index + 1), copy, ...elements.slice(index + 1)], id: copy.id }
}

/** Later elements paint on top, so moving forward means moving toward the end of the list. */
export function shiftLayer(elements: FreeElement[], id: string, direction: 1 | -1): FreeElement[] {
  const index = elements.findIndex((element) => element.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= elements.length) return elements
  const next = [...elements]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
