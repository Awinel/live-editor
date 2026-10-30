'use client'

import { useEffect, useState } from 'react'

import { ColorInput } from './ColorField'
import { SHADOW_LIMITS, newShadowLayer, type ShadowLayer } from './styleTypes'

/** Holds the typed text until it is a finished number, so values like "-" or "1." can be typed through. */
export function DraftNumber({
  label,
  ariaLabel = label,
  value,
  limits,
  unit = 'px',
  onChange,
}: {
  label: string
  ariaLabel?: string
  value: number
  limits: [number, number]
  unit?: string
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  return (
    <label className="lc-sf__number">
      <span className="lc-sf__label">{label}</span>
      <span className="lc-sf__number-box">
        <input
          type="number"
          className="lc-sf__input"
          aria-label={ariaLabel}
          min={limits[0]}
          max={limits[1]}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            const next = Number(event.target.value)
            if (event.target.value !== '' && Number.isFinite(next) && next >= limits[0] && next <= limits[1]) {
              onChange(next)
            }
          }}
          onBlur={() => {
            const next = Number(text)
            const clamped = text === '' || !Number.isFinite(next) ? value : Math.min(limits[1], Math.max(limits[0], next))
            setText(String(clamped))
            if (clamped !== value) onChange(clamped)
          }}
        />
        <span className="lc-sf__unit">{unit}</span>
      </span>
    </label>
  )
}

export function ShadowLayers({ value, onChange }: { value: ShadowLayer[]; onChange: (layers: ShadowLayer[]) => void }) {
  const update = (index: number, patch: Partial<ShadowLayer>) =>
    onChange(value.map((layer, i) => (i === index ? { ...layer, ...patch } : layer)))

  return (
    <div className="lc-sf__layers">
      {value.map((layer, index) => {
        const name = `Shadow layer ${index + 1}`
        return (
          <fieldset key={index} className="lc-sf__layer" aria-label={name}>
            <div className="lc-sf__layer-head">
              <strong>Layer {index + 1}</strong>
              <label className="lc-sf__check">
                <input
                  type="checkbox"
                  checked={layer.inset === true}
                  onChange={(event) => update(index, { inset: event.target.checked || undefined })}
                />
                Inner shadow
              </label>
              <button
                type="button"
                className="lc-cf__icon"
                aria-label={`Remove ${name.toLowerCase()}`}
                title="Remove layer"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
            <div className="lc-sf__grid">
              <DraftNumber
                label="X offset"
                ariaLabel={`${name} X offset`}
                value={layer.x}
                limits={SHADOW_LIMITS.x}
                onChange={(x) => update(index, { x })}
              />
              <DraftNumber
                label="Y offset"
                ariaLabel={`${name} Y offset`}
                value={layer.y}
                limits={SHADOW_LIMITS.y}
                onChange={(y) => update(index, { y })}
              />
              <DraftNumber
                label="Blur"
                ariaLabel={`${name} blur`}
                value={layer.blur}
                limits={SHADOW_LIMITS.blur}
                onChange={(blur) => update(index, { blur })}
              />
              <DraftNumber
                label="Spread"
                ariaLabel={`${name} spread`}
                value={layer.spread}
                limits={SHADOW_LIMITS.spread}
                onChange={(spread) => update(index, { spread })}
              />
            </div>
            <ColorInput
              label={`${name} color`}
              value={layer.color}
              onChange={(color) => update(index, { color: color ?? '#0f4c5c' })}
            />
            <DraftNumber
              label="Opacity"
              ariaLabel={`${name} opacity`}
              value={layer.alpha}
              limits={SHADOW_LIMITS.alpha}
              unit="%"
              onChange={(alpha) => update(index, { alpha })}
            />
          </fieldset>
        )
      })}
      <button
        type="button"
        className="lc-cf__button"
        disabled={value.length >= SHADOW_LIMITS.layers}
        onClick={() => onChange([...value, newShadowLayer()])}
      >
        + Add shadow layer
      </button>
    </div>
  )
}
