'use client'

import { useGetPuck } from '@puckeditor/core'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { containerUnit } from '../style/toStyle'
import { CANVAS_LIMITS, type FreeElement } from './canvasTypes'
import { selectElement, useSelectedElement } from './canvasStore'
import { ElementBody, boardStyle, boxStyle, type CanvasFrameProps } from './FreeCanvasView'
import { resizeBox, rotationFromPointer, snapMove, type Guides } from './geometry'
import { duplicateElement, removeElement, shiftLayer, updateElement } from './operations'

type Point = { x: number; y: number }

type Interaction =
  | { type: 'move'; id: string; start: FreeElement; pointer: Point; moved: boolean }
  | { type: 'resize'; id: string; start: FreeElement; pointer: Point; hx: number; hy: number; moved: boolean }
  | { type: 'rotate'; id: string; start: FreeElement; center: Point; moved: boolean }

const HANDLES = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
] as const

const handleCursor = (hx: number, hy: number) =>
  hx === 0 ? 'ns-resize' : hy === 0 ? 'ew-resize' : hx === hy ? 'nwse-resize' : 'nesw-resize'

const TEXT_KINDS = new Set(['heading', 'text', 'button'])
const SNAP_THRESHOLD_PX = 6
const MIN_GRID_SPACING_PX = 6

const percent = (value: number, total: number) => `${(value / total) * 100}%`

const isTyping = (target: EventTarget | null) =>
  target instanceof Element &&
  (target.closest('input, textarea, select') !== null || (target as HTMLElement).isContentEditable)

function InlineText({
  initial,
  onDone,
}: {
  initial: string
  onDone: (text: string | null) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.focus()
    const range = node.ownerDocument.createRange()
    range.selectNodeContents(node)
    const selection = node.ownerDocument.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    const finish = () => onDone(node.innerText.replace(/\n$/, ''))
    const onKey = (event: KeyboardEvent) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        node.removeEventListener('blur', finish)
        onDone(null)
      } else if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        node.blur()
      }
    }
    node.addEventListener('blur', finish)
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('blur', finish)
      node.removeEventListener('keydown', onKey)
    }
  }, [onDone])

  return (
    <span
      ref={ref}
      className="lc-el-inline"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      data-lc-inline
    >
      {initial}
    </span>
  )
}

export function FreeCanvasEditor({ blockId, ...props }: CanvasFrameProps & { blockId: string }) {
  const { artboard, grid, elements } = props
  const getPuck = useGetPuck()
  const selectedId = useSelectedElement(blockId)
  const [draft, setDraft] = useState<FreeElement | null>(null)
  const [guides, setGuides] = useState<Guides | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [boardPx, setBoardPx] = useState(artboard.width)
  const boardRef = useRef<HTMLDivElement>(null)
  const interaction = useRef<Interaction | null>(null)
  const draftRef = useRef<FreeElement | null>(null)
  const latest = useRef({ props, selectedId, editingId })

  useLayoutEffect(() => {
    latest.current = { props, selectedId, editingId }
  })

  const commit = useCallback(
    (next: FreeElement[]) => {
      const puck = getPuck()
      const selector = puck.getSelectorForId(blockId)
      const item = puck.getItemById(blockId)
      if (!selector || !item) return
      puck.dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: { ...item, props: { ...item.props, elements: next } },
      })
    },
    [getPuck, blockId],
  )

  const setDraftElement = (element: FreeElement | null) => {
    draftRef.current = element
    setDraft(element)
  }

  const finishText = useCallback(
    (text: string | null) => {
      const id = latest.current.editingId
      setEditingId(null)
      boardRef.current?.focus({ preventScroll: true })
      if (text === null || !id) return
      const element = latest.current.props.elements.find((item) => item.id === id)
      if (!element || element.content.text === text) return
      commit(updateElement(latest.current.props.elements, id, { content: { ...element.content, text } }))
    },
    [commit],
  )

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(([entry]) => setBoardPx(entry.contentRect.width))
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const designPerScreenPx = () => latest.current.props.artboard.width / board.getBoundingClientRect().width

    const onPointerDown = (event: PointerEvent) => {
      // Stops Puck from starting a drag of the whole block; clicks still bubble so Puck selects it.
      event.stopPropagation()
      if (event.button !== 0) return
      const target = event.target as Element
      if (target.closest('[data-lc-inline]')) return

      const node = target.closest<HTMLElement>('[data-lc-el]')
      if (!node?.dataset.lcEl) {
        selectElement(blockId, null)
        board.focus({ preventScroll: true })
        return
      }

      const id = node.dataset.lcEl
      const start = latest.current.props.elements.find((element) => element.id === id)
      if (!start) return
      selectElement(blockId, id)
      event.preventDefault()
      board.focus({ preventScroll: true })

      const pointer = { x: event.clientX, y: event.clientY }
      const handle = target.closest<HTMLElement>('[data-lc-handle]')?.dataset.lcHandle
      if (handle === 'rotate') {
        const rect = board.getBoundingClientRect()
        const ratio = rect.width / latest.current.props.artboard.width
        interaction.current = {
          type: 'rotate',
          id,
          start,
          moved: false,
          center: {
            x: rect.left + (start.x + start.w / 2) * ratio,
            y: rect.top + (start.y + start.h / 2) * ratio,
          },
        }
      } else if (handle) {
        const [hx, hy] = handle.split(',').map(Number)
        interaction.current = { type: 'resize', id, start, pointer, hx, hy, moved: false }
      } else {
        interaction.current = { type: 'move', id, start, pointer, moved: false }
      }
      board.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      const current = interaction.current
      if (!current) return
      const { props: latestProps } = latest.current
      const scale = designPerScreenPx()
      const freeMove = event.altKey
      const gridSize = latestProps.grid.snap && !freeMove ? latestProps.grid.size : 0

      if (current.type === 'rotate') {
        current.moved = true
        const rotation = rotationFromPointer(current.center, { x: event.clientX, y: event.clientY }, event.shiftKey ? 15 : 0)
        setDraftElement({ ...current.start, rotation })
        return
      }

      const dx = (event.clientX - current.pointer.x) * scale
      const dy = (event.clientY - current.pointer.y) * scale
      if (!current.moved && Math.hypot(dx, dy) < 2 * scale) return
      current.moved = true

      if (current.type === 'resize') {
        const box = resizeBox(current.start, current.hx, current.hy, dx, dy, {
          keepRatio: event.shiftKey,
          grid: gridSize,
          min: CANVAS_LIMITS.minSize,
        })
        setDraftElement({ ...current.start, ...box })
        return
      }

      const others = latestProps.elements.filter((element) => element.id !== current.id)
      const snapped = snapMove(
        { ...current.start, x: current.start.x + dx, y: current.start.y + dy },
        others,
        latestProps.artboard,
        { grid: gridSize, threshold: freeMove ? 0 : SNAP_THRESHOLD_PX * scale },
      )
      setDraftElement({ ...current.start, x: snapped.x, y: snapped.y })
      setGuides(snapped.guides.x.length || snapped.guides.y.length ? snapped.guides : null)
    }

    const onPointerUp = () => {
      const current = interaction.current
      interaction.current = null
      const finished = draftRef.current
      if (current?.moved && finished) {
        commit(updateElement(latest.current.props.elements, finished.id, finished))
      }
      setDraftElement(null)
      setGuides(null)
    }

    const onDoubleClick = (event: MouseEvent) => {
      // Pointer capture retargets clicks to the board, so find the element under the pointer instead.
      const hit = board.ownerDocument.elementFromPoint(event.clientX, event.clientY)
      const node = hit?.closest<HTMLElement>('[data-lc-el]')
      const element = latest.current.props.elements.find((item) => item.id === node?.dataset.lcEl)
      if (element && TEXT_KINDS.has(element.kind)) setEditingId(element.id)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const { props: latestProps, selectedId: id } = latest.current
      if (!id) return
      const element = latestProps.elements.find((item) => item.id === id)
      if (!element) return
      const step = event.shiftKey ? (latestProps.grid.snap ? latestProps.grid.size : 10) : 1
      const nudge = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[
        event.key
      ]
      const modifier = event.ctrlKey || event.metaKey

      if (nudge) {
        commit(updateElement(latestProps.elements, id, { x: element.x + nudge[0], y: element.y + nudge[1] }))
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        commit(removeElement(latestProps.elements, id))
        selectElement(blockId, null)
      } else if (modifier && event.key.toLowerCase() === 'd') {
        const result = duplicateElement(latestProps.elements, id)
        if (result.id) {
          commit(result.elements)
          selectElement(blockId, result.id)
        }
      } else if (event.key === ']' || event.key === '[') {
        commit(shiftLayer(latestProps.elements, id, event.key === ']' ? 1 : -1))
      } else if (event.key === 'Enter' && TEXT_KINDS.has(element.kind)) {
        setEditingId(id)
      } else if (event.key === 'Escape') {
        selectElement(blockId, null)
      } else {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    board.addEventListener('pointerdown', onPointerDown)
    board.addEventListener('pointermove', onPointerMove)
    board.addEventListener('pointerup', onPointerUp)
    board.addEventListener('pointercancel', onPointerUp)
    board.addEventListener('dblclick', onDoubleClick)
    board.addEventListener('keydown', onKeyDown)
    return () => {
      board.removeEventListener('pointerdown', onPointerDown)
      board.removeEventListener('pointermove', onPointerMove)
      board.removeEventListener('pointerup', onPointerUp)
      board.removeEventListener('pointercancel', onPointerUp)
      board.removeEventListener('dblclick', onDoubleClick)
      board.removeEventListener('keydown', onKeyDown)
    }
  }, [blockId, commit])

  const unit = containerUnit(artboard.width)
  const shown = draft ? elements.map((element) => (element.id === draft.id ? draft : element)) : elements
  const screenPerDesignPx = boardPx / artboard.width
  const gridStep = grid.size * Math.max(1, Math.ceil(MIN_GRID_SPACING_PX / (grid.size * screenPerDesignPx)))

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      role="application"
      aria-label="Free canvas. Click an element to select it, drag to move, arrow keys to nudge, Enter to edit text."
      className="lc-canvas lc-canvas--editing"
      style={boardStyle(props)}
    >
      {grid.show && (
        <div
          className="lc-canvas__grid"
          aria-hidden="true"
          style={{ backgroundSize: `${percent(gridStep, artboard.width)} ${percent(gridStep, artboard.height)}` }}
        />
      )}
      {shown.map((element) => {
        const selected = element.id === selectedId
        const editing = element.id === editingId
        return (
          <div
            key={element.id}
            data-lc-el={element.id}
            className={`lc-el${selected ? ' lc-el--selected' : ''}`}
            style={boxStyle(element, artboard)}
          >
            <ElementBody
              element={element}
              unit={unit}
              isEditing
              textSlot={
                editing ? <InlineText initial={element.content.text ?? ''} onDone={finishText} /> : undefined
              }
            />
            {selected && !editing && (
              <>
                {HANDLES.map(([hx, hy]) => (
                  <span
                    key={`${hx},${hy}`}
                    data-lc-handle={`${hx},${hy}`}
                    className="lc-handle"
                    style={{ left: `${(hx + 1) * 50}%`, top: `${(hy + 1) * 50}%`, cursor: handleCursor(hx, hy) }}
                  />
                ))}
                <span data-lc-handle="rotate" className="lc-handle lc-handle--rotate" />
              </>
            )}
          </div>
        )
      })}
      {guides?.x.map((x) => (
        <div key={`x${x}`} className="lc-canvas__guide lc-canvas__guide--x" style={{ left: percent(x, artboard.width) }} />
      ))}
      {guides?.y.map((y) => (
        <div key={`y${y}`} className="lc-canvas__guide lc-canvas__guide--y" style={{ top: percent(y, artboard.height) }} />
      ))}
    </div>
  )
}
