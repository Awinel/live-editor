import type { Config, Data, Slot } from '@puckeditor/core'

import { MARKUP_HEIGHT } from './blockTypes'
import { display } from './fonts'
import { MarkupFrame } from './MarkupFrame'
import { safeHref, safeSrc } from './urls'

type Align = 'left' | 'center'

export type BlockProps = {
  Heading: { text: string; level: 'h2' | 'h3'; align: Align }
  Text: { text: string; tone: 'body' | 'muted'; align: Align }
  Image: { src: string; alt: string; ratio: 'auto' | '16/9' | '4/3' | '1/1' }
  Button: { label: string; href: string; variant: 'solid' | 'outline' }
  Stack: {
    direction: 'vertical' | 'horizontal'
    gap: 'sm' | 'md' | 'lg'
    align: 'start' | 'center' | 'stretch'
    items: Slot
  }
  Markup: { html: string; css: string; height: number }
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

export const config: ComponentConfig = {
  categories: {
    content: { title: 'Content', components: ['Heading', 'Text', 'Image', 'Button'] },
    layout: { title: 'Layout', components: ['Stack'] },
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
      },
      defaultProps: { text: 'A clear headline', level: 'h2', align: 'left' },
      render: ({ text, level, align }) => {
        const Tag = level
        return <Tag className={`lc-heading lc-heading--${level} lc-align--${align}`}>{text}</Tag>
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
      },
      defaultProps: {
        text: 'Say what this component is for in a sentence or two.',
        tone: 'body',
        align: 'left',
      },
      render: ({ text, tone, align }) => (
        <p className={`lc-text lc-text--${tone} lc-align--${align}`}>{text}</p>
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
      },
      defaultProps: { src: '', alt: '', ratio: '16/9' },
      render: ({ src, alt, ratio }) => {
        const url = safeSrc(src)
        const style = ratio === 'auto' ? undefined : { aspectRatio: ratio }
        if (!url) {
          return (
            <div className="lc-image lc-image--empty" style={style}>
              Add an image URL
            </div>
          )
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img className="lc-image" src={url} alt={alt} style={style} loading="lazy" />
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
      },
      defaultProps: { label: 'Get started', href: '#', variant: 'solid' },
      render: ({ label, href, variant, puck }) => (
        <a
          className={`lc-button lc-button--${variant}`}
          href={safeHref(href)}
          tabIndex={puck?.isEditing ? -1 : undefined}
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
      },
      defaultProps: { direction: 'vertical', gap: 'md', align: 'stretch', items: [] },
      render: ({ direction, gap, align, items: Items }) => (
        <Items
          className={`lc-stack lc-stack--${direction} lc-gap--${gap} lc-items--${align}`}
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
      },
      defaultProps: {
        html: '<div class="badge">Custom markup</div>',
        css: '.badge { display: inline-block; padding: 8px 14px; border-radius: 999px; background: #0F4C5C; color: #fff; font-weight: 600; }',
        height: MARKUP_HEIGHT.fallback,
      },
      render: ({ html, css, height, puck }) => (
        <MarkupFrame html={html} css={css} height={height} isEditing={puck?.isEditing} />
      ),
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
