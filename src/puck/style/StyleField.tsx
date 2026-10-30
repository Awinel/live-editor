'use client'

import { FieldLabel } from '@puckeditor/core'
import { useState, type ReactNode } from 'react'

import './fields.css'

import { ColorInput } from './ColorField'
import { ShadowLayers } from './ShadowEditor'
import {
  BORDER_SIDES,
  FONT_WEIGHTS,
  NUMBER_LIMITS,
  RADIUS_CORNERS,
  SHADOW_PRESETS,
  newShadowLayer,
  type BlockStyle,
  type NumericStyleKey,
  type Shadow,
} from './styleTypes'
import { toStyle } from './toStyle'

export type StyleGroup = 'size' | 'spacing' | 'typography' | 'fill' | 'effects'

const GROUP_KEYS: Record<StyleGroup, Array<keyof BlockStyle>> = {
  size: ['widthMode', 'width', 'maxWidth', 'minHeight'],
  spacing: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom'],
  typography: ['color', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'italic', 'uppercase'],
  fill: ['background', 'borderWidth', ...BORDER_SIDES, 'borderStyle', 'borderColor', 'radius', ...RADIUS_CORNERS],
  effects: ['shadow', 'shadows', 'opacity'],
}

const PREVIEW_KEYS = [...GROUP_KEYS.fill, ...GROUP_KEYS.effects]

/** A swatch showing the current fill, border, corners and shadow together. */
function StylePreview({ style }: { style: BlockStyle }) {
  const picked = Object.fromEntries(PREVIEW_KEYS.map((key) => [key, style[key]]))
  return (
    <div className="lc-sf__preview" aria-hidden="true">
      <div className="lc-sf__preview-box" style={toStyle(picked)} />
    </div>
  )
}

const BORDER_LABELS = ['Top', 'Right', 'Bottom', 'Left']
const CORNER_LABELS = ['Top left', 'Top right', 'Bottom right', 'Bottom left']

const GROUP_TITLES: Record<StyleGroup, string> = {
  size: 'Size',
  spacing: 'Spacing',
  typography: 'Typography',
  fill: 'Fill and border',
  effects: 'Effects',
}

const PADDING_KEYS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const

export type StyleEditorProps = {
  value: BlockStyle | undefined
  onChange: (value: BlockStyle | undefined) => void
  readOnly?: boolean
  groups?: StyleGroup[]
  omit?: Array<keyof BlockStyle>
}

function NumberInput({
  label,
  name,
  style,
  set,
  unit = 'px',
  step = 1,
}: {
  label: string
  name: NumericStyleKey
  style: BlockStyle
  set: <K extends keyof BlockStyle>(key: K, value: BlockStyle[K]) => void
  unit?: string
  step?: number
}) {
  const [min, max] = NUMBER_LIMITS[name]
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
          step={step}
          placeholder="Auto"
          value={style[name] ?? ''}
          onChange={(event) =>
            set(name, event.target.value === '' ? undefined : Number(event.target.value))
          }
        />
        {unit && <span className="lc-sf__unit">{unit}</span>}
      </span>
    </label>
  )
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | undefined
  options: Array<{ label: string; value: T }>
  onChange: (value: T | undefined) => void
}) {
  return (
    <label className="lc-sf__number">
      <span className="lc-sf__label">{label}</span>
      <select
        className="lc-sf__input"
        aria-label={label}
        value={value === undefined ? '' : String(value)}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value)
          onChange(option?.value)
        }}
      >
        <option value="">Default</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Section({
  title,
  count,
  onReset,
  children,
}: {
  title: string
  count: number
  onReset: () => void
  children: ReactNode
}) {
  return (
    <details className="lc-sf__section">
      <summary className="lc-sf__summary">
        <span>{title}</span>
        {count > 0 && <span className="lc-sf__count">{count}</span>}
      </summary>
      <div className="lc-sf__body">
        {children}
        {count > 0 && (
          <button type="button" className="lc-sf__reset" onClick={onReset}>
            Reset {title.toLowerCase()}
          </button>
        )}
      </div>
    </details>
  )
}

export function StyleEditor({
  value,
  onChange,
  readOnly,
  groups = ['size', 'spacing', 'typography', 'fill', 'effects'],
  omit = [],
}: StyleEditorProps) {
  const style = value ?? {}
  const shows = (key: keyof BlockStyle) => !omit.includes(key)
  const [linked, setLinked] = useState(() =>
    PADDING_KEYS.every((key) => style[key] === style.paddingTop),
  )
  const [sameBorder, setSameBorder] = useState(() => BORDER_SIDES.every((key) => style[key] === undefined))
  const [sameCorners, setSameCorners] = useState(() => RADIUS_CORNERS.every((key) => style[key] === undefined))

  // Switching modes carries the current value across, so nothing visibly changes until the user edits.
  const linkBorder = (same: boolean) => {
    setSameBorder(same)
    const sides = Object.fromEntries(BORDER_SIDES.map((key) => [key, same ? undefined : style[key] ?? style.borderWidth]))
    commit({ ...style, ...sides, borderWidth: same ? (style.borderTopWidth ?? style.borderWidth) : undefined })
  }
  const linkCorners = (same: boolean) => {
    setSameCorners(same)
    const corners = Object.fromEntries(RADIUS_CORNERS.map((key) => [key, same ? undefined : style[key] ?? style.radius]))
    commit({ ...style, ...corners, radius: same ? (style.radiusTopLeft ?? style.radius) : undefined })
  }

  const shadowMode = style.shadows ? 'custom' : (style.shadow ?? '')
  const chooseShadow = (mode: string) => {
    if (mode === 'custom') {
      const preset = style.shadow && style.shadow !== 'none' ? SHADOW_PRESETS[style.shadow] : [newShadowLayer()]
      commit({ ...style, shadow: undefined, shadows: structuredClone(preset) })
    } else {
      commit({ ...style, shadow: (mode || undefined) as Shadow | undefined, shadows: undefined })
    }
  }

  const commit = (next: BlockStyle) => {
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, item]) => item !== undefined && item !== false),
    ) as BlockStyle
    onChange(Object.keys(cleaned).length ? cleaned : undefined)
  }

  const set = <K extends keyof BlockStyle>(key: K, item: BlockStyle[K]) => commit({ ...style, [key]: item })

  const reset = (group: StyleGroup) =>
    commit(Object.fromEntries(Object.entries(style).filter(([key]) => !GROUP_KEYS[group].includes(key as keyof BlockStyle))))

  const countFor = (group: StyleGroup) =>
    GROUP_KEYS[group].filter((key) => shows(key) && style[key] !== undefined).length

  const sections: Record<StyleGroup, ReactNode> = {
    size: (
      <>
        <Choice
          label="Width"
          value={style.widthMode}
          options={[
            { label: 'Fit content', value: 'auto' },
            { label: 'Fill available', value: 'fill' },
            { label: 'Fixed', value: 'fixed' },
          ]}
          onChange={(mode) => set('widthMode', mode)}
        />
        <div className="lc-sf__grid">
          {style.widthMode === 'fixed' && <NumberInput label="Fixed width" name="width" style={style} set={set} />}
          {shows('maxWidth') && <NumberInput label="Max width" name="maxWidth" style={style} set={set} />}
          {shows('minHeight') && <NumberInput label="Min height" name="minHeight" style={style} set={set} />}
        </div>
      </>
    ),
    spacing: (
      <>
        {shows('paddingTop') && (
          <label className="lc-sf__check">
            <input type="checkbox" checked={linked} onChange={(event) => setLinked(event.target.checked)} />
            Same padding on all sides
          </label>
        )}
        {!shows('paddingTop') ? null : linked ? (
          <label className="lc-sf__number">
            <span className="lc-sf__label">Padding</span>
            <span className="lc-sf__number-box">
              <input
                type="number"
                className="lc-sf__input"
                aria-label="Padding"
                min={0}
                max={NUMBER_LIMITS.paddingTop[1]}
                placeholder="Auto"
                value={style.paddingTop ?? ''}
                onChange={(event) => {
                  const next = event.target.value === '' ? undefined : Number(event.target.value)
                  commit({ ...style, paddingTop: next, paddingRight: next, paddingBottom: next, paddingLeft: next })
                }}
              />
              <span className="lc-sf__unit">px</span>
            </span>
          </label>
        ) : (
          <div className="lc-sf__grid">
            <NumberInput label="Top" name="paddingTop" style={style} set={set} />
            <NumberInput label="Right" name="paddingRight" style={style} set={set} />
            <NumberInput label="Bottom" name="paddingBottom" style={style} set={set} />
            <NumberInput label="Left" name="paddingLeft" style={style} set={set} />
          </div>
        )}
        {shows('marginTop') && (
          <div className="lc-sf__grid">
            <NumberInput label="Space above" name="marginTop" style={style} set={set} />
            <NumberInput label="Space below" name="marginBottom" style={style} set={set} />
          </div>
        )}
      </>
    ),
    typography: (
      <>
        <ColorInput label="Text color" value={style.color} onChange={(color) => set('color', color)} />
        <div className="lc-sf__grid">
          <NumberInput label="Font size" name="fontSize" style={style} set={set} />
          <Choice
            label="Weight"
            value={style.fontWeight}
            options={FONT_WEIGHTS}
            onChange={(weight) => set('fontWeight', weight)}
          />
          <NumberInput label="Line height" name="lineHeight" style={style} set={set} unit="×" step={0.05} />
          <NumberInput label="Letter spacing" name="letterSpacing" style={style} set={set} step={0.5} />
        </div>
        {shows('textAlign') && (
          <Choice
            label="Text align"
            value={style.textAlign}
            options={[
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
              { label: 'Justify', value: 'justify' },
            ]}
            onChange={(align) => set('textAlign', align)}
          />
        )}
        <div className="lc-sf__row">
          <label className="lc-sf__check">
            <input
              type="checkbox"
              checked={style.italic === true}
              onChange={(event) => set('italic', event.target.checked || undefined)}
            />
            Italic
          </label>
          <label className="lc-sf__check">
            <input
              type="checkbox"
              checked={style.uppercase === true}
              onChange={(event) => set('uppercase', event.target.checked || undefined)}
            />
            Uppercase
          </label>
        </div>
      </>
    ),
    fill: (
      <>
        <StylePreview style={style} />
        {shows('background') && (
          <ColorInput label="Background" value={style.background} onChange={(color) => set('background', color)} />
        )}
        <label className="lc-sf__check">
          <input type="checkbox" checked={sameBorder} onChange={(event) => linkBorder(event.target.checked)} />
          Same border on all sides
        </label>
        <div className="lc-sf__grid">
          {sameBorder ? (
            <NumberInput label="Border" name="borderWidth" style={style} set={set} />
          ) : (
            BORDER_SIDES.map((key, index) => (
              <NumberInput key={key} label={`${BORDER_LABELS[index]} border`} name={key} style={style} set={set} />
            ))
          )}
          <Choice
            label="Border style"
            value={style.borderStyle}
            options={[
              { label: 'Solid', value: 'solid' },
              { label: 'Dashed', value: 'dashed' },
              { label: 'Dotted', value: 'dotted' },
            ]}
            onChange={(border) => set('borderStyle', border)}
          />
        </div>
        <ColorInput label="Border color" value={style.borderColor} onChange={(color) => set('borderColor', color)} />
        <label className="lc-sf__check">
          <input type="checkbox" checked={sameCorners} onChange={(event) => linkCorners(event.target.checked)} />
          Same radius on all corners
        </label>
        {sameCorners ? (
          <NumberInput label="Corner radius" name="radius" style={style} set={set} />
        ) : (
          <div className="lc-sf__grid">
            {RADIUS_CORNERS.map((key, index) => (
              <NumberInput key={key} label={`${CORNER_LABELS[index]} corner`} name={key} style={style} set={set} />
            ))}
          </div>
        )}
      </>
    ),
    effects: (
      <>
        <StylePreview style={style} />
        <div className="lc-sf__grid">
          <label className="lc-sf__number">
            <span className="lc-sf__label">Shadow</span>
            <select
              className="lc-sf__input"
              aria-label="Shadow"
              value={shadowMode}
              onChange={(event) => chooseShadow(event.target.value)}
            >
              <option value="">Default</option>
              <option value="none">None</option>
              <option value="sm">Soft</option>
              <option value="md">Medium</option>
              <option value="lg">Deep</option>
              <option value="custom">Custom…</option>
            </select>
          </label>
          <NumberInput label="Opacity" name="opacity" style={style} set={set} unit="%" />
        </div>
        {style.shadows ? (
          <ShadowLayers
            value={style.shadows}
            onChange={(layers) => commit({ ...style, shadows: layers.length ? layers : undefined })}
          />
        ) : (
          <p className="lc-cf__hint">Choose Custom to set offset, blur, spread, color and inner shadows, with up to four layers.</p>
        )}
      </>
    ),
  }

  return (
    <fieldset className="lc-sf" disabled={readOnly}>
      {groups.map((group) => (
        <Section key={group} title={GROUP_TITLES[group]} count={countFor(group)} onReset={() => reset(group)}>
          {sections[group]}
        </Section>
      ))}
    </fieldset>
  )
}

export function StyleField(props: StyleEditorProps & { label?: string }) {
  return (
    <FieldLabel label={props.label ?? 'Style'} el="div" readOnly={props.readOnly}>
      <StyleEditor {...props} />
    </FieldLabel>
  )
}
