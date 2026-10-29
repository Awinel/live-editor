import type { Config, CustomField, Data, Slot } from '@puckeditor/core'

import { MARKUP_HEIGHT } from './blockTypes'
import { ArtboardField, BackgroundField, ElementsField, GridField } from './canvas/CanvasFields'
import { defaultCanvasProps, type FreeCanvasProps } from './canvas/canvasTypes'
import { FreeCanvasEditor } from './canvas/FreeCanvasEditor'
import { FreeCanvasView } from './canvas/FreeCanvasView'
import { sanitizeCanvasProps } from './canvas/sanitizeCanvas'
import { display } from './fonts'
import { MarkupFrame } from './MarkupFrame'
import { StyleField, type StyleEditorProps } from './style/StyleField'
import type { BlockStyle } from './style/styleTypes'
import { toStyle } from './style/toStyle'
import { safeHref, safeSrc } from './urls'

type Align = 'left' | 'center'
type Styled<Props> = Props & { style?: BlockStyle }

export type BlockProps = {
  Heading: Styled<{ text: string; level: 'h2' | 'h3'; align: Align }>
  Text: Styled<{ text: string; tone: 'body' | 'muted'; align: Align }>
  Image: Styled<{ src: string; alt: string; ratio: 'auto' | '16/9' | '4/3' | '1/1' }>
  Button: Styled<{ label: string; href: string; variant: 'solid' | 'outline' }>
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

const custom = <Value,>(render: CustomField<Value>['render']): CustomField<Value> => ({ type: 'custom', render })

export const config: ComponentConfig = {
  categories: {
    content: { title: 'Content', components: ['Heading', 'Text', 'Image', 'Button'] },
    layout: { title: 'Layout', components: ['Stack'] },
    freeform: { title: 'Freeform', components: ['FreeCanvas'] },
    custom: { title: 'Custom', components: ['Markup'] },
  },
  root: {
    fields: {},
    render: ({ children, puck }) => (
      <div className={`lc-root ${display.variable}${puck?.isEditing ? ' lc-root--editing' : ''}`}>
        {children}
      </div>
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
      },
      defaultProps: { text: 'A clear headline', level: 'h2', align: 'left' },
      render: ({ text, level, align, style }) => {
        const Tag = level
        return (
          <Tag className={`lc-heading lc-heading--${level} lc-align--${align}`} style={toStyle(style)}>
            {text}
          </Tag>
        )
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
      },
      defaultProps: {
        text: 'Say what this component is for in a sentence or two.',
        tone: 'body',
        align: 'left',
      },
      render: ({ text, tone, align, style }) => (
        <p className={`lc-text lc-text--${tone} lc-align--${align}`} style={toStyle(style)}>
          {text}
        </p>
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
      },
      defaultProps: { src: '', alt: '', ratio: '16/9' },
      render: ({ src, alt, ratio, style }) => {
        const url = safeSrc(src)
        const css = { ...(ratio === 'auto' ? {} : { aspectRatio: ratio }), ...toStyle(style) }
        if (!url) {
          return (
            <div className="lc-image lc-image--empty" style={css}>
              Add an image URL
            </div>
          )
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img className="lc-image" src={url} alt={alt} style={css} loading="lazy" />
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
      },
      defaultProps: { label: 'Get started', href: '#', variant: 'solid' },
      render: ({ label, href, variant, style, puck }) => (
        <a
          className={`lc-button lc-button--${variant}`}
          href={safeHref(href)}
          tabIndex={puck?.isEditing ? -1 : undefined}
          style={toStyle(style)}
        >
          {label}
        </a>
      ),
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
      },
      defaultProps: { direction: 'vertical', gap: 'md', align: 'stretch', items: [] },
      render: ({ direction, gap, align, style, items: Items }) => (
        <Items
          className={`lc-stack lc-stack--${direction} lc-gap--${gap} lc-items--${align}`}
          style={toStyle(style)}
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
      },
      defaultProps: {
        html: '<div class="badge">Custom markup</div>',
        css: '.badge { display: inline-block; padding: 8px 14px; border-radius: 999px; background: #0F4C5C; color: #fff; font-weight: 600; }',
        height: MARKUP_HEIGHT.fallback,
      },
      render: ({ html, css, height, style, puck }) => (
        <MarkupFrame html={html} css={css} height={height} style={toStyle(style)} isEditing={puck?.isEditing} />
      ),
    },
    FreeCanvas: {
      label: 'Free canvas',
      fields: {
        artboard: custom(ArtboardField),
        background: custom(BackgroundField),
        grid: custom(GridField),
        elements: custom(ElementsField),
        style: styleField({
          groups: ['spacing', 'fill', 'effects'],
          omit: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'background'],
        }),
      },
      defaultProps: defaultCanvasProps(),
      render: ({ id, puck, artboard, background, grid, elements, style }) => {
        const canvas = sanitizeCanvasProps({ artboard, background, grid, elements })
        return puck?.isEditing ? (
          <FreeCanvasEditor blockId={id} frame={style} {...canvas} />
        ) : (
          <FreeCanvasView frame={style} {...canvas} />
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
