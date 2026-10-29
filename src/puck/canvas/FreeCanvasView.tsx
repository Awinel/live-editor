import type { CSSProperties, ReactNode } from 'react'

import type { BlockStyle } from '../style/styleTypes'
import { containerUnit, toStyle, type LengthUnit } from '../style/toStyle'
import { safeHref, safeSrc } from '../urls'
import type { Artboard, FreeCanvasProps, FreeElement } from './canvasTypes'

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

export type CanvasFrameProps = FreeCanvasProps & { frame?: BlockStyle }

export function boardStyle(props: CanvasFrameProps): CSSProperties {
  const { width, height } = props.artboard
  return {
    ...toStyle(props.frame),
    aspectRatio: `${width} / ${height}`,
    maxWidth: `${width}px`,
    background: props.background,
    fontSize: containerUnit(width)(16),
  }
}

type BodyProps = {
  element: FreeElement
  unit: LengthUnit
  isEditing?: boolean
  textSlot?: ReactNode
}

/** The element itself, filling the positioned box drawn around it. */
export function ElementBody({ element, unit, isEditing, textSlot }: BodyProps) {
  const style = toStyle(element.style, unit)
  const { content } = element
  const text = textSlot ?? content.text

  switch (element.kind) {
    case 'heading': {
      const Tag = content.level === 'h3' ? 'h3' : 'h2'
      return (
        <Tag className="lc-el-body lc-el-heading" style={style}>
          {text}
        </Tag>
      )
    }
    case 'text':
      return (
        <p className="lc-el-body lc-el-text" style={style}>
          {text}
        </p>
      )
    case 'button':
      return (
        <a
          className="lc-el-body lc-el-button"
          href={safeHref(content.href ?? '#')}
          tabIndex={isEditing ? -1 : undefined}
          style={style}
        >
          {text}
        </a>
      )
    case 'image': {
      const src = safeSrc(content.src ?? '')
      if (!src) {
        return (
          <div className="lc-el-body lc-el-image lc-el-image--empty" style={style}>
            Image
          </div>
        )
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="lc-el-body lc-el-image"
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
          className="lc-el-body lc-el-shape"
          aria-hidden="true"
          style={{ ...style, borderRadius: content.shape === 'ellipse' ? '50%' : style.borderRadius }}
        />
      )
  }
}

export function FreeCanvasView(props: CanvasFrameProps) {
  const unit = containerUnit(props.artboard.width)
  return (
    <div className="lc-canvas" style={boardStyle(props)}>
      {props.elements.map((element) => (
        <div key={element.id} className="lc-el" style={boxStyle(element, props.artboard)}>
          <ElementBody element={element} unit={unit} />
        </div>
      ))}
    </div>
  )
}
