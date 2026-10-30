import type { CSSProperties, ReactNode } from 'react'

import { animationProps, withClass } from '../animation/animationCss'
import type { BlockAnimation } from '../animation/animationTypes'
import type { BlockStyle } from '../style/styleTypes'
import { containerUnit, toStyle, type LengthUnit } from '../style/toStyle'
import { safeFieldName, safeHref, safeSrc } from '../urls'
import type { Artboard, FreeCanvasProps, FreeElement } from './canvasTypes'
import { shapeStyle } from './shapes'
import { responsiveCanvasCss } from './viewports'

const percent = (value: number, total: number) => `${Math.round((value / total) * 1_000_000) / 10_000}%`

export function boxStyle(element: FreeElement, artboard: Artboard): CSSProperties {
  return {
    left: percent(element.x, artboard.width),
    top: percent(element.y, artboard.height),
    width: percent(element.w, artboard.width),
    height: percent(element.h, artboard.height),
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  }
}

export type CanvasFrameProps = FreeCanvasProps & { frame?: BlockStyle; animation?: BlockAnimation }

export function boardStyle(props: CanvasFrameProps, frame: Artboard = props.artboard): CSSProperties {
  return {
    ...toStyle(props.frame),
    aspectRatio: `${frame.width} / ${frame.height}`,
    maxWidth: `${frame.width}px`,
    background: props.background,
    // Type stays relative to the large artboard, so a narrower frame scales it instead of resetting it.
    fontSize: containerUnit(props.artboard.width)(16),
  }
}

/** Class and style for the board itself, including the whole-canvas animation. */
export function boardProps(props: CanvasFrameProps, baseClass: string, frame?: Artboard) {
  const animation = animationProps(props.animation)
  return { className: withClass(baseClass, animation.className), style: { ...boardStyle(props, frame), ...animation.style } }
}

type BodyProps = {
  element: FreeElement
  unit: LengthUnit
  isEditing?: boolean
  textSlot?: ReactNode
}

/**
 * The element itself, filling the positioned box drawn around it. Animations run here rather than on the box,
 * so their transforms never replace the box's rotation.
 */
export function ElementBody({ element, unit, isEditing, textSlot }: BodyProps) {
  const animation = animationProps(element.animation)
  const style = { ...toStyle(element.style, unit), ...animation.style }
  const body = (name: string) => withClass(`lc-el-body ${name}`.trim(), animation.className)
  const { content } = element
  const text = textSlot ?? content.text

  switch (element.kind) {
    case 'heading': {
      const Tag = content.level === 'h3' ? 'h3' : 'h2'
      return (
        <Tag className={body('lc-el-heading')} style={style}>
          {text}
        </Tag>
      )
    }
    case 'text':
      return (
        <p className={body('lc-el-text')} style={style}>
          {text}
        </p>
      )
    case 'button':
      return (
        <a
          className={body('lc-el-button')}
          href={safeHref(content.href ?? '#')}
          tabIndex={isEditing ? -1 : undefined}
          style={style}
        >
          {text}
        </a>
      )
    case 'input': {
      const name = safeFieldName(content.name)
      const shared = {
        className: 'lc-el-input__control',
        name,
        placeholder: content.placeholder || undefined,
        readOnly: isEditing || undefined,
      }
      const control =
        textSlot ??
        (content.inputType === 'textarea' ? (
          <textarea {...shared} rows={3} {...(isEditing ? { value: content.text ?? '' } : { defaultValue: content.text ?? '' })} />
        ) : (
          <input
            {...shared}
            type={content.inputType ?? 'text'}
            {...(isEditing ? { value: content.text ?? '' } : { defaultValue: content.text ?? '' })}
          />
        ))
      return (
        <label className={body('lc-el-input')} style={style}>
          {content.label ? <span className="lc-el-input__label">{content.label}</span> : null}
          {control}
        </label>
      )
    }
    case 'image': {
      const src = safeSrc(content.src ?? '')
      if (!src) {
        return (
          <div className={body('lc-el-image lc-el-image--empty')} style={style}>
            Image
          </div>
        )
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={body('lc-el-image')}
          src={src}
          alt={content.alt ?? ''}
          draggable={false}
          style={{ ...style, objectFit: content.fit ?? 'cover' }}
        />
      )
    }
    case 'shape':
      return (
        <div
          className={body('lc-el-shape')}
          aria-hidden={text ? undefined : true}
          style={shapeStyle(content.shape, style)}
        >
          {text}
        </div>
      )
  }
}

export function FreeCanvasView({ canvasId = 'canvas', ...props }: CanvasFrameProps & { canvasId?: string }) {
  const unit = containerUnit(props.artboard.width)
  const id = canvasId.replace(/[^\w-]/g, '') || 'canvas'
  const board = boardProps(props, 'lc-canvas')
  const { aspectRatio: _aspectRatio, maxWidth: _maxWidth, ...chrome } = board.style
  return (
    <div data-lc-canvas={id} className={board.className} style={chrome}>
      <style>{responsiveCanvasCss(id, props)}</style>
      {props.elements.map((element) => (
        <div key={element.id} className="lc-el" data-lc-el={element.id}>
          <ElementBody element={element} unit={unit} />
        </div>
      ))}
    </div>
  )
}
