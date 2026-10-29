'use client'

import { useEffect, useState } from 'react'

import { PALETTE, isSafeColor } from './styleTypes'

type ColorInputProps = {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  readOnly?: boolean
}

const toPickerValue = (value: string | undefined) => {
  if (!value || !value.startsWith('#')) return '#000000'
  if (value.length === 4 || value.length === 5) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return value.slice(0, 7)
}

export function ColorInput({ label, value, onChange, readOnly }: ColorInputProps) {
  const [text, setText] = useState(value ?? '')

  useEffect(() => {
    setText(value ?? '')
  }, [value])

  return (
    <fieldset className="lc-sf__color" disabled={readOnly}>
      <legend className="lc-sf__label">{label}</legend>
      <div className="lc-sf__swatches">
        {PALETTE.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            className="lc-sf__swatch"
            style={{ background: swatch.value }}
            title={swatch.name}
            aria-label={`${label}: ${swatch.name}`}
            aria-pressed={value?.toLowerCase() === swatch.value}
            onClick={() => onChange(swatch.value)}
          />
        ))}
      </div>
      <div className="lc-sf__color-row">
        <input
          type="color"
          className="lc-sf__picker"
          aria-label={`${label}: custom color`}
          value={toPickerValue(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className="lc-sf__input"
          aria-label={`${label}: hex or rgba value`}
          placeholder="Not set"
          spellCheck={false}
          value={text}
          onChange={(event) => {
            const next = event.target.value.trim()
            setText(next)
            if (next === '') onChange(undefined)
            else if (isSafeColor(next)) onChange(next)
          }}
          onBlur={() => setText(value ?? '')}
        />
        <button
          type="button"
          className="lc-sf__clear"
          aria-label={`Clear ${label.toLowerCase()}`}
          disabled={!value}
          onClick={() => onChange(undefined)}
        >
          Clear
        </button>
      </div>
    </fieldset>
  )
}
