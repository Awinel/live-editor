import type { Config, CustomField, Data, Slot } from '@puckeditor/core'
import type { CSSProperties } from 'react'

import { EDITOR_ANIMATION_CSS, SITE_ANIMATION_CSS, animationProps, withClass } from './animation/animationCss'
import { AnimationField } from './animation/AnimationField'
import type { BlockAnimation } from './animation/animationTypes'
import { MARKUP_HEIGHT } from './blockTypes'
import { ArtboardField, BackgroundField, ElementsField, GridField, ViewportField } from './canvas/CanvasFields'
import { defaultCanvasProps, type FreeCanvasProps, type InputType } from './canvas/canvasTypes'
import { FreeCanvasEditor } from './canvas/FreeCanvasEditor'
import { FreeCanvasView } from './canvas/FreeCanvasView'
import { sanitizeCanvasProps } from './canvas/sanitizeCanvas'
import { display } from './fonts'
import { MarkupFrame } from './MarkupFrame'
import { StyleField, type StyleEditorProps } from './style/StyleField'
import type { BlockStyle } from './style/styleTypes'
import { toStyle } from './style/toStyle'
import { safeFieldName, safeHref, safeSrc } from './urls'

type Align = 'left' | 'center'
type Styled<Props> = Props & { style?: BlockStyle; animation?: BlockAnimation }

export type BlockProps = {
  Heading: Styled<{ text: string; level: 'h2' | 'h3'; align: Align }>
  Text: Styled<{ text: string; tone: 'body' | 'muted'; align: Align }>
  Image: Styled<{ src: string; alt: string; ratio: 'auto' | '16/9' | '4/3' | '1/1' }>
  Button: Styled<{ label: string; href: string; variant: 'solid' | 'outline' }>
  Input: Styled<{ label: string; placeholder: string; value: string; name: string; type: InputType }>
  Stack: Styled<{
    direction: 'vertical' | 'horizontal'
    gap: 'sm' | 'md' | 'lg'
    align: 'start' | 'center' | 'stretch'
    items: Slot
  }>
  Markup: Styled<{ html: string; css: string; height: number }>
  FreeCanvas: Styled<FreeCanvasProps>
}

export type RootProps = { title?: string; description?: string }

export type ComponentConfig = Config<BlockProps, RootProps>
export type ComponentData = Data<BlockProps, RootProps>

const alignField = {
  type: 'radio' as const,
  label: 'Alignment',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
  ],
}

const styleField = (
  options: Pick<StyleEditorProps, 'groups' | 'omit'> = {},
): CustomField<BlockStyle | undefined> => ({
  type: 'custom',
  label: 'Style',
  render: ({ value, onChange, readOnly }) => (
    <StyleField value={value} onChange={onChange} readOnly={readOnly} {...options} />
  ),
})

const animationField = (label = 'Animation', subject?: string): CustomField<BlockAnimation | undefined> => ({
  type: 'custom',
  label,
  render: ({ value, onChange, readOnly }) => (
    <AnimationField label={label} subject={subject} value={value} onChange={onChange} readOnly={readOnly} />
  ),
})

/** Merges a block's own class and style with its validated style and animation. */
const look = (className: string, style: unknown, animation: unknown, extra: CSSProperties = {}) => {
  const animated = animationProps(animation)
  return {
    className: withClass(className, animated.className),
    style: { ...extra, ...toStyle(style as BlockStyle | undefined), ...animated.style },
  }
}

const custom = <Value,>(render: CustomField<Value>['render']): CustomField<Value> => ({ type: 'custom', render })

export const config: ComponentConfig = {
  categories: {
    content: { title: 'Content', components: ['Heading', 'Text', 'Image', 'Button', 'Input'] },
    layout: { title: 'Layout', components: ['Stack'] },
    freeform: { title: 'Freeform', components: ['FreeCanvas'] },
    custom: { title: 'Custom', components: ['Markup'] },
  },
  root: {
    fields: {},
    // The style sits beside .lc-root so it never counts as one of the blocks inside it.
    render: ({ children, puck }) => (
      <>
        <style>{puck?.isEditing ? EDITOR_ANIMATION_CSS : SITE_ANIMATION_CSS}</style>
        <div className={`lc-root ${display.variable}${puck?.isEditing ? ' lc-root--editing' : ''}`}>
          {children}
        </div>
      </>
    ),
  },
  components: {
    Heading: {
      fields: {
        text: { type: 'text', label: 'Text', contentEditable: true },
        level: {
          type: 'radio',
          label: 'Size',
          options: [
            { label: 'Large', value: 'h2' },
            { label: 'Small', value: 'h3' },
          ],
        },
        align: alignField,
        style: styleField(),
        animation: animationField(),
      },
      defaultProps: { text: 'A clear headline', level: 'h2', align: 'left' },
      render: ({ text, level, align, style, animation }) => {
        const Tag = level
        return <Tag {...look(`lc-heading lc-heading--${level} lc-align--${align}`, style, animation)}>{text}</Tag>
      },
    },
    Text: {
      fields: {
        text: { type: 'textarea', label: 'Text', contentEditable: true },
        tone: {
          type: 'radio',
          label: 'Tone',
          options: [
            { label: 'Body', value: 'body' },
            { label: 'Muted', value: 'muted' },
          ],
        },
        align: alignField,
        style: styleField(),
        animation: animationField(),
      },
      defaultProps: {
        text: 'Say what this component is for in a sentence or two.',
        tone: 'body',
        align: 'left',
      },
      render: ({ text, tone, align, style, animation }) => (
        <p {...look(`lc-text lc-text--${tone} lc-align--${align}`, style, animation)}>{text}</p>
      ),
    },
    Image: {
      fields: {
        src: { type: 'text', label: 'Image URL' },
        alt: { type: 'text', label: 'Alt text' },
        ratio: {
          type: 'select',
          label: 'Shape',
          options: [
            { label: 'Original', value: 'auto' },
            { label: 'Wide (16:9)', value: '16/9' },
            { label: 'Classic (4:3)', value: '4/3' },
            { label: 'Square', value: '1/1' },
          ],
        },
        style: styleField({ groups: ['size', 'spacing', 'fill', 'effects'] }),
        animation: animationField(),
      },
      defaultProps: { src: '', alt: '', ratio: '16/9' },
      render: ({ src, alt, ratio, style, animation }) => {
        const url = safeSrc(src)
        const ratioStyle = ratio === 'auto' ? {} : { aspectRatio: ratio }
        if (!url) {
          return <div {...look('lc-image lc-image--empty', style, animation, ratioStyle)}>Add an image URL</div>
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...look('lc-image', style, animation, ratioStyle)} src={url} alt={alt} loading="lazy" />
      },
    },
    Button: {
      fields: {
        label: { type: 'text', label: 'Label', contentEditable: true },
        href: { type: 'text', label: 'Link' },
        variant: {
          type: 'radio',
          label: 'Style',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Outline', value: 'outline' },
          ],
        },
        style: styleField(),
        animation: animationField(),
      },
      defaultProps: { label: 'Get started', href: '#', variant: 'solid' },
      render: ({ label, href, variant, style, animation, puck }) => (
        <a
          {...look(`lc-button lc-button--${variant}`, style, animation)}
          href={safeHref(href)}
          tabIndex={puck?.isEditing ? -1 : undefined}
        >
          {label}
        </a>
      ),
    },
    Input: {
      fields: {
        label: { type: 'text', label: 'Label', contentEditable: true },
        placeholder: { type: 'text', label: 'Placeholder' },
        value: { type: 'text', label: 'Value' },
        name: { type: 'text', label: 'Name' },
        type: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Number', value: 'number' },
            { label: 'Password', value: 'password' },
            { label: 'Multiline', value: 'textarea' },
          ],
        },
        style: styleField(),
        animation: animationField(),
      },
      defaultProps: {
        label: 'Email',
        placeholder: 'you@example.com',
        value: '',
        name: 'email',
        type: 'email',
      },
      render: ({ label, placeholder, value, name, type, style, animation, puck }) => {
        const animated = animationProps(animation)
        const control = {
          className: 'lc-field__control',
          style: toStyle(style),
          name: safeFieldName(name),
          placeholder,
          readOnly: puck?.isEditing || undefined,
          tabIndex: puck?.isEditing ? -1 : undefined,
        }
        return (
          <label className={withClass('lc-field', animated.className)} style={animated.style}>
            {label ? <span className="lc-field__label">{label}</span> : null}
            {type === 'textarea' ? (
              <textarea {...control} rows={4} {...(puck?.isEditing ? { value } : { defaultValue: value })} />
            ) : (
              <input {...control} type={type} {...(puck?.isEditing ? { value } : { defaultValue: value })} />
            )}
          </label>
        )
      },
    },
    Stack: {
      fields: {
        direction: {
          type: 'radio',
          label: 'Direction',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
          ],
        },
        gap: {
          type: 'select',
          label: 'Spacing',
          options: [
            { label: 'Tight', value: 'sm' },
            { label: 'Comfortable', value: 'md' },
            { label: 'Loose', value: 'lg' },
          ],
        },
        align: {
          type: 'select',
          label: 'Align items',
          options: [
            { label: 'Start', value: 'start' },
            { label: 'Center', value: 'center' },
            { label: 'Stretch', value: 'stretch' },
          ],
        },
        items: { type: 'slot' },
        style: styleField({ groups: ['size', 'spacing', 'fill', 'effects'] }),
        animation: animationField(),
      },
      defaultProps: { direction: 'vertical', gap: 'md', align: 'stretch', items: [] },
      render: ({ direction, gap, align, style, animation, items: Items }) => (
        <Items
          {...look(`lc-stack lc-stack--${direction} lc-gap--${gap} lc-items--${align}`, style, animation)}
          minEmptyHeight={96}
        />
      ),
    },
    Markup: {
      fields: {
        html: { type: 'textarea', label: 'HTML' },
        css: { type: 'textarea', label: 'CSS' },
        height: {
          type: 'number',
          label: 'Height (px)',
          min: MARKUP_HEIGHT.min,
          max: MARKUP_HEIGHT.max,
        },
        style: styleField({ groups: ['size', 'spacing', 'fill', 'effects'], omit: ['minHeight'] }),
        animation: animationField(),
      },
      defaultProps: {
        html: '<div class="badge">Custom markup</div>',
        css: '.badge { display: inline-block; padding: 8px 14px; border-radius: 999px; background: #0F4C5C; color: #fff; font-weight: 600; }',
        height: MARKUP_HEIGHT.fallback,
      },
      render: ({ html, css, height, style, animation, puck }) => (
        <MarkupFrame html={html} css={css} height={height} {...look('', style, animation)} isEditing={puck?.isEditing} />
      ),
    },
    FreeCanvas: {
      label: 'Free canvas',
      fields: {
        artboard: custom(ArtboardField),
        viewports: custom(ViewportField),
        background: custom(BackgroundField),
        grid: custom(GridField),
        elements: custom(ElementsField),
        style: styleField({
          groups: ['spacing', 'fill', 'effects'],
          omit: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'background'],
        }),
        animation: animationField('Canvas animation', 'Canvas'),
      },
      defaultProps: defaultCanvasProps(),
      render: ({ id, puck, artboard, background, grid, elements, style, animation }) => {
        const canvas = sanitizeCanvasProps({ artboard, background, grid, elements })
        return puck?.isEditing ? (
          <FreeCanvasEditor blockId={id} frame={style} animation={animation} {...canvas} />
        ) : (
          <FreeCanvasView canvasId={id} frame={style} animation={animation} {...canvas} />
        )
      },
    },
  },
}

export const studioConfig: ComponentConfig = {
  ...config,
  root: {
    ...config.root,
    fields: {
      title: { type: 'text', label: 'Component name' },
      description: { type: 'textarea', label: 'What it is for' },
    },
  },
}
