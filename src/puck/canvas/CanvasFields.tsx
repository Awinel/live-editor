'use client'

import { FieldLabel, createUsePuck } from '@puckeditor/core'

import '../style/fields.css'

import { ColorInput } from '../style/ColorField'
import { StyleEditor, type StyleGroup } from '../style/StyleField'
import type { BlockStyle } from '../style/styleTypes'
import {
  ARTBOARD_PRESETS,
  CANVAS_LIMITS,
  ELEMENT_KINDS,
  GRID_SIZES,
  KIND_LABELS,
  createElement,
  type Artboard,
  type ElementContent,
  type FreeElement,
  type GridSettings,
  type GridSize,
} from './canvasTypes'
import { selectElement, useSelectedElement } from './canvasStore'
import { removeElement, shiftLayer, updateElement } from './operations'

const usePuck = createUsePuck()

type FieldProps<T> = { value: T; onChange: (value: T) => void; readOnly?: boolean }

function NumberBox({
  label,
  value,
  onChange,
  min,
  max,
  unit = 'px',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
}) {
  return (
    <label className="lc-sf__number">
      <span className="lc-sf__label">{label}</span>
      <span className="lc-sf__number-box">
        <input
          type="number"
          className="lc-sf__input"
          aria-label={label}
          min={min}
          max={max}
          value={Math.round(value)}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (event.target.value !== '' && Number.isFinite(next)) onChange(next)
          }}
        />
        <span className="lc-sf__unit">{unit}</span>
      </span>
    </label>
  )
}

export function ArtboardField({ value, onChange, readOnly }: FieldProps<Artboard>) {
  const preset = ARTBOARD_PRESETS.find((item) => item.width === value.width && item.height === value.height)
  const [minW, maxW] = CANVAS_LIMITS.artboardWidth
  const [minH, maxH] = CANVAS_LIMITS.artboardHeight
  return (
    <FieldLabel label="Canvas size" el="div" readOnly={readOnly}>
      <fieldset className="lc-cf" disabled={readOnly}>
        <select
          className="lc-sf__input"
          aria-label="Size preset"
          value={preset ? preset.label : 'custom'}
          onChange={(event) => {
            const next = ARTBOARD_PRESETS.find((item) => item.label === event.target.value)
            if (next) onChange({ width: next.width, height: next.height })
          }}
        >
          {ARTBOARD_PRESETS.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label} ({item.width} × {item.height})
            </option>
          ))}
          <option value="custom" disabled={Boolean(preset)}>
            Custom
          </option>
        </select>
        <div className="lc-sf__grid">
          <NumberBox
            label="Width"
            value={value.width}
            min={minW}
            max={maxW}
            onChange={(width) => onChange({ ...value, width: Math.min(maxW, Math.max(minW, width)) })}
          />
          <NumberBox
            label="Height"
            value={value.height}
            min={minH}
            max={maxH}
            onChange={(height) => onChange({ ...value, height: Math.min(maxH, Math.max(minH, height)) })}
          />
        </div>
        <p className="lc-cf__hint">On smaller screens the whole canvas scales down proportionally.</p>
      </fieldset>
    </FieldLabel>
  )
}

export function BackgroundField({ value, onChange, readOnly }: FieldProps<string | undefined>) {
  return <ColorInput label="Background" value={value} onChange={onChange} readOnly={readOnly} />
}

export function GridField({ value, onChange, readOnly }: FieldProps<GridSettings>) {
  return (
    <FieldLabel label="Pixel grid" el="div" readOnly={readOnly}>
      <fieldset className="lc-cf" disabled={readOnly}>
        <div className="lc-sf__row">
          <label className="lc-sf__check">
            <input
              type="checkbox"
              checked={value.show}
              onChange={(event) => onChange({ ...value, show: event.target.checked })}
            />
            Show grid
          </label>
          <label className="lc-sf__check">
            <input
              type="checkbox"
              checked={value.snap}
              onChange={(event) => onChange({ ...value, snap: event.target.checked })}
            />
            Snap to grid
          </label>
        </div>
        <label className="lc-sf__number">
          <span className="lc-sf__label">Grid size</span>
          <select
            className="lc-sf__input"
            aria-label="Grid size"
            value={value.size}
            onChange={(event) => onChange({ ...value, size: Number(event.target.value) as GridSize })}
          >
            {GRID_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </select>
        </label>
        <p className="lc-cf__hint">Hold Alt while dragging to place freely, ignoring the grid and guides.</p>
      </fieldset>
    </FieldLabel>
  )
}

const summary = (element: FreeElement) =>
  element.content.text?.trim() ||
  element.content.alt?.trim() ||
  (element.kind === 'shape' ? (element.content.shape === 'ellipse' ? 'Ellipse' : 'Rectangle') : 'Untitled')

const STYLE_GROUPS: Record<FreeElement['kind'], StyleGroup[]> = {
  heading: ['typography', 'spacing', 'fill', 'effects'],
  text: ['typography', 'spacing', 'fill', 'effects'],
  button: ['typography', 'spacing', 'fill', 'effects'],
  image: ['fill', 'effects'],
  shape: ['fill', 'effects'],
}

function ContentEditor({
  element,
  onContent,
}: {
  element: FreeElement
  onContent: (content: ElementContent) => void
}) {
  const { content } = element
  const set = (patch: Partial<ElementContent>) => onContent({ ...content, ...patch })

  switch (element.kind) {
    case 'heading':
    case 'text':
      return (
        <>
          <label className="lc-sf__number">
            <span className="lc-sf__label">Text</span>
            <textarea
              className="lc-sf__input"
              value={content.text ?? ''}
              maxLength={CANVAS_LIMITS.maxText}
              onChange={(event) => set({ text: event.target.value })}
            />
          </label>
          {element.kind === 'heading' && (
            <label className="lc-sf__number">
              <span className="lc-sf__label">Heading level</span>
              <select
                className="lc-sf__input"
                aria-label="Heading level"
                value={content.level ?? 'h2'}
                onChange={(event) => set({ level: event.target.value === 'h3' ? 'h3' : 'h2' })}
              >
                <option value="h2">Main heading (h2)</option>
                <option value="h3">Subheading (h3)</option>
              </select>
            </label>
          )}
        </>
      )
    case 'button':
      return (
        <div className="lc-sf__grid">
          <label className="lc-sf__number">
            <span className="lc-sf__label">Label</span>
            <input
              className="lc-sf__input"
              value={content.text ?? ''}
              maxLength={120}
              onChange={(event) => set({ text: event.target.value })}
            />
          </label>
          <label className="lc-sf__number">
            <span className="lc-sf__label">Link</span>
            <input
              className="lc-sf__input"
              value={content.href ?? ''}
              placeholder="https://"
              onChange={(event) => set({ href: event.target.value })}
            />
          </label>
        </div>
      )
    case 'image':
      return (
        <>
          <label className="lc-sf__number">
            <span className="lc-sf__label">Image URL</span>
            <input
              className="lc-sf__input"
              value={content.src ?? ''}
              placeholder="https://"
              onChange={(event) => set({ src: event.target.value })}
            />
          </label>
          <div className="lc-sf__grid">
            <label className="lc-sf__number">
              <span className="lc-sf__label">Alt text</span>
              <input
                className="lc-sf__input"
                value={content.alt ?? ''}
                onChange={(event) => set({ alt: event.target.value })}
              />
            </label>
            <label className="lc-sf__number">
              <span className="lc-sf__label">Fit</span>
              <select
                className="lc-sf__input"
                aria-label="Fit"
                value={content.fit ?? 'cover'}
                onChange={(event) => set({ fit: event.target.value === 'contain' ? 'contain' : 'cover' })}
              >
                <option value="cover">Fill the box</option>
                <option value="contain">Show whole image</option>
              </select>
            </label>
          </div>
        </>
      )
    case 'shape':
      return (
        <label className="lc-sf__number">
          <span className="lc-sf__label">Shape</span>
          <select
            className="lc-sf__input"
            aria-label="Shape"
            value={content.shape ?? 'rect'}
            onChange={(event) => set({ shape: event.target.value === 'ellipse' ? 'ellipse' : 'rect' })}
          >
            <option value="rect">Rectangle</option>
            <option value="ellipse">Ellipse</option>
          </select>
        </label>
      )
  }
}

export function ElementsField({ value, onChange, readOnly }: FieldProps<FreeElement[]>) {
  const blockId = usePuck((state) => state.selectedItem?.props.id as string | undefined)
  const artboard = usePuck((state) => state.selectedItem?.props.artboard as Artboard | undefined)
  const selectedId = useSelectedElement(blockId)
  const elements = value ?? []
  const selected = elements.find((element) => element.id === selectedId)
  const select = (id: string | null) => blockId && selectElement(blockId, id)
  const patch = (id: string, change: Partial<FreeElement>) => onChange(updateElement(elements, id, change))
  const full = elements.length >= CANVAS_LIMITS.maxElements

  return (
    <FieldLabel label="Elements" el="div" readOnly={readOnly}>
      <fieldset className="lc-cf" disabled={readOnly}>
        <div className="lc-cf__add" role="group" aria-label="Add element">
          {ELEMENT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="lc-cf__button"
              disabled={full}
              onClick={() => {
                const element = createElement(kind, artboard ?? { width: 960, height: 540 })
                onChange([...elements, element])
                select(element.id)
              }}
            >
              + {KIND_LABELS[kind]}
            </button>
          ))}
        </div>

        {elements.length > 0 ? (
          <ol className="lc-cf__layers" aria-label="Layers, front to back">
            {[...elements].reverse().map((element, reversedIndex) => {
              const index = elements.length - 1 - reversedIndex
              const name = `${KIND_LABELS[element.kind]}: ${summary(element)}`
              return (
                <li key={element.id} className="lc-cf__layer" data-selected={element.id === selectedId}>
                  <button
                    type="button"
                    className="lc-cf__layer-name"
                    aria-current={element.id === selectedId}
                    onClick={() => select(element.id)}
                  >
                    <small>{KIND_LABELS[element.kind]}</small>
                    {summary(element)}
                  </button>
                  <span className="lc-cf__layer-actions">
                    <button
                      type="button"
                      className="lc-cf__icon"
                      aria-label={`Bring ${name} forward`}
                      title="Bring forward"
                      disabled={index === elements.length - 1}
                      onClick={() => onChange(shiftLayer(elements, element.id, 1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="lc-cf__icon"
                      aria-label={`Send ${name} backward`}
                      title="Send backward"
                      disabled={index === 0}
                      onClick={() => onChange(shiftLayer(elements, element.id, -1))}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="lc-cf__icon"
                      aria-label={`Delete ${name}`}
                      title="Delete"
                      onClick={() => {
                        onChange(removeElement(elements, element.id))
                        if (element.id === selectedId) select(null)
                      }}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="lc-cf__hint">The canvas is empty. Add an element to start.</p>
        )}

        {selected ? (
          <section className="lc-cf__inspector" aria-label={`Selected ${KIND_LABELS[selected.kind]}`}>
            <h3 className="lc-cf__inspector-title">Selected {KIND_LABELS[selected.kind].toLowerCase()}</h3>
            <ContentEditor element={selected} onContent={(content) => patch(selected.id, { content })} />
            <div className="lc-cf__grid-4">
              <NumberBox label="X" value={selected.x} onChange={(x) => patch(selected.id, { x })} />
              <NumberBox label="Y" value={selected.y} onChange={(y) => patch(selected.id, { y })} />
              <NumberBox
                label="Width"
                value={selected.w}
                min={CANVAS_LIMITS.minSize}
                onChange={(w) => patch(selected.id, { w: Math.max(CANVAS_LIMITS.minSize, w) })}
              />
              <NumberBox
                label="Height"
                value={selected.h}
                min={CANVAS_LIMITS.minSize}
                onChange={(h) => patch(selected.id, { h: Math.max(CANVAS_LIMITS.minSize, h) })}
              />
              <NumberBox
                label="Rotation"
                value={selected.rotation}
                min={-180}
                max={180}
                unit="°"
                onChange={(rotation) => patch(selected.id, { rotation: Math.min(180, Math.max(-180, rotation)) })}
              />
            </div>
            <StyleEditor
              key={selected.id}
              value={selected.style}
              groups={STYLE_GROUPS[selected.kind]}
              omit={['marginTop', 'marginBottom']}
              onChange={(style: BlockStyle | undefined) => patch(selected.id, { style })}
            />
          </section>
        ) : (
          <p className="lc-cf__hint">
            Select an element on the canvas or in the list to edit it. Double-click text to edit it in place. Shift
            keeps proportions while resizing and rotates in 15° steps.
          </p>
        )}
      </fieldset>
    </FieldLabel>
  )
}
