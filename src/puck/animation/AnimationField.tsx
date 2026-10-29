'use client'

import { FieldLabel } from '@puckeditor/core'
import { useEffect, useState } from 'react'

import '../style/fields.css'

import {
  ANIMATION_EASINGS,
  ANIMATION_LIMITS,
  ANIMATION_TRIGGERS,
  EASING_LABELS,
  ENTRANCE_PRESETS,
  LOOP_PRESETS,
  PRESET_LABELS,
  TRIGGER_LABELS,
  defaultAnimation,
  isLoopPreset,
  type AnimationEasing,
  type AnimationPreset,
  type AnimationTrigger,
  type BlockAnimation,
} from './animationTypes'
import { playPreview, replayPreview, stopPreview, usePreviewing } from './animationPreview'

export type AnimationEditorProps = {
  value: BlockAnimation | undefined
  onChange: (value: BlockAnimation | undefined) => void
  readOnly?: boolean
  /** Names the thing being animated in control labels, for example "Canvas". */
  subject?: string
}

/** Keeps what the user types until it is a finished number, then clamps it when they leave the field. */
function MillisecondsInput({
  label,
  value,
  limits,
  onChange,
  disabled,
}: {
  label: string
  value: number
  limits: [number, number]
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const clamp = (next: number) => Math.round(Math.min(limits[1], Math.max(limits[0], next)))

  return (
    <label className="lc-sf__number">
      <span className="lc-sf__label">{label}</span>
      <span className="lc-sf__number-box">
        <input
          type="number"
          className="lc-sf__input"
          aria-label={label}
          min={limits[0]}
          max={limits[1]}
          step={50}
          disabled={disabled}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            const next = Number(event.target.value)
            if (event.target.value !== '' && Number.isFinite(next) && next >= limits[0] && next <= limits[1]) {
              onChange(Math.round(next))
            }
          }}
          onBlur={() => {
            const next = Number(text)
            const finalValue = text === '' || !Number.isFinite(next) ? value : clamp(next)
            setText(String(finalValue))
            if (finalValue !== value) onChange(finalValue)
          }}
        />
        <span className="lc-sf__unit">ms</span>
      </span>
    </label>
  )
}

export function AnimationEditor({ value, onChange, readOnly, subject }: AnimationEditorProps) {
  const previewing = usePreviewing()
  const prefix = subject ? `${subject} animation` : 'Animation'

  const commit = (next: BlockAnimation | undefined) => {
    onChange(next)
    if (next) replayPreview()
  }
  const set = <K extends keyof BlockAnimation>(key: K, item: BlockAnimation[K]) =>
    value && commit({ ...value, [key]: item })

  const choosePreset = (preset: AnimationPreset | '') => {
    if (!preset) return commit(undefined)
    if (value && isLoopPreset(value.preset) === isLoopPreset(preset)) return commit({ ...value, preset })
    const fresh = defaultAnimation(preset)
    commit(value ? { ...fresh, trigger: value.trigger, delay: value.delay } : fresh)
  }

  const scroll = value?.trigger === 'scroll'

  return (
    <fieldset className="lc-sf lc-af" disabled={readOnly}>
      <label className="lc-sf__number">
        <span className="lc-sf__label">Effect</span>
        <select
          className="lc-sf__input"
          aria-label={`${prefix} effect`}
          value={value?.preset ?? ''}
          onChange={(event) => choosePreset(event.target.value as AnimationPreset | '')}
        >
          <option value="">None</option>
          <optgroup label="Entrance">
            {ENTRANCE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {PRESET_LABELS[preset]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Loop">
            {LOOP_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {PRESET_LABELS[preset]}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {value && (
        <>
          <label className="lc-sf__number">
            <span className="lc-sf__label">Starts</span>
            <select
              className="lc-sf__input"
              aria-label={`${prefix} start`}
              value={value.trigger}
              onChange={(event) => set('trigger', event.target.value as AnimationTrigger)}
            >
              {ANIMATION_TRIGGERS.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {TRIGGER_LABELS[trigger]}
                </option>
              ))}
            </select>
          </label>

          <div className="lc-sf__grid">
            <MillisecondsInput
              label={scroll ? 'Length' : 'Duration'}
              value={value.duration}
              limits={ANIMATION_LIMITS.duration}
              onChange={(duration) => set('duration', duration)}
            />
            {!scroll && (
              <MillisecondsInput
                label="Delay"
                value={value.delay}
                limits={ANIMATION_LIMITS.delay}
                onChange={(delay) => set('delay', delay)}
              />
            )}
          </div>

          <label className="lc-sf__number">
            <span className="lc-sf__label">Easing</span>
            <select
              className="lc-sf__input"
              aria-label={`${prefix} easing`}
              value={value.easing}
              onChange={(event) => set('easing', event.target.value as AnimationEasing)}
            >
              {ANIMATION_EASINGS.map((easing) => (
                <option key={easing} value={easing}>
                  {EASING_LABELS[easing]}
                </option>
              ))}
            </select>
          </label>

          {scroll ? (
            <p className="lc-cf__hint">
              Plays as the element scrolls into view and follows the scroll position. Browsers without scroll-linked
              animation support play it once on load instead.
            </p>
          ) : (
            <>
              <div className="lc-sf__grid lc-af__repeat">
                <label className="lc-sf__number">
                  <span className="lc-sf__label">Plays</span>
                  <span className="lc-sf__number-box">
                    <input
                      type="number"
                      className="lc-sf__input"
                      aria-label={`${prefix} repeat count`}
                      min={ANIMATION_LIMITS.iterations[0]}
                      max={ANIMATION_LIMITS.iterations[1]}
                      disabled={value.loop}
                      value={value.loop ? '' : value.iterations}
                      placeholder="∞"
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        const [min, max] = ANIMATION_LIMITS.iterations
                        if (event.target.value !== '' && Number.isFinite(next)) {
                          set('iterations', Math.round(Math.min(max, Math.max(min, next))))
                        }
                      }}
                    />
                    <span className="lc-sf__unit">×</span>
                  </span>
                </label>
                <label className="lc-sf__check">
                  <input
                    type="checkbox"
                    checked={value.loop}
                    onChange={(event) => set('loop', event.target.checked)}
                  />
                  Loop forever
                </label>
              </div>
              <label className="lc-sf__check">
                <input
                  type="checkbox"
                  checked={value.alternate}
                  onChange={(event) => set('alternate', event.target.checked)}
                />
                Play back and forth
              </label>
            </>
          )}
        </>
      )}

      <div className="lc-af__preview">
        <button type="button" className="lc-cf__button lc-af__play" onClick={playPreview}>
          {previewing ? '↻ Replay' : '▶ Play animations'}
        </button>
        {previewing && (
          <button type="button" className="lc-cf__button" onClick={stopPreview}>
            Stop
          </button>
        )}
      </div>
      <p className="lc-cf__hint">
        Animations hold still while you edit so dragging stays precise. Play shows every animation on the page.
      </p>
    </fieldset>
  )
}

export function AnimationField(props: AnimationEditorProps & { label?: string }) {
  return (
    <FieldLabel label={props.label ?? 'Animation'} el="div" readOnly={props.readOnly}>
      <AnimationEditor {...props} />
    </FieldLabel>
  )
}
