import { describe, expect, it } from 'vitest'

import { exportComposition } from '@/puck/export'

const composition = {
  root: { props: {} },
  content: [
    {
      type: 'Heading',
      props: { id: 'h', text: 'Hello <script>alert(1)</script>', level: 'h2', align: 'left', style: { color: '#123abc', fontSize: 64 } },
    },
    { type: 'Button', props: { id: 'b', label: 'Go', href: 'javascript:alert(1)', variant: 'solid', style: { background: '#e36414' } } },
    { type: 'Markup', props: { id: 'm', html: '<p class="x" onclick="evil()">Hi</p><script>bad()</script>', css: '.x{color:red}', height: 200 } },
    {
      type: 'FreeCanvas',
      props: {
        id: 'c',
        artboard: { width: 960, height: 540 },
        grid: { show: true, snap: true, size: 8 },
        background: '#f7fbfc',
        elements: [
          { id: 'e1', kind: 'heading', x: 96, y: 54, w: 480, h: 108, rotation: 15, content: { text: 'Free', level: 'h2' }, style: { fontSize: 48 } },
          { id: 'e2', kind: 'image', x: 0, y: 0, w: 100, h: 100, rotation: 0, content: { src: '' } },
        ],
      },
    },
  ],
}

const file = (files: ReturnType<typeof exportComposition>, id: string) => files.find((item) => item.id === id)!.content

describe('HTML + CSS export', () => {
  const files = exportComposition(composition, 'html', 'Launch <hero>')
  const html = file(files, 'snippet')
  const css = file(files, 'css')

  it('escapes text, neutralises unsafe links and strips scripts from markup', () => {
    expect(html).toContain('Hello &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('href="#"')
    expect(html).not.toMatch(/onclick|bad\(\)|javascript:/)
    expect(html).toContain('<template shadowrootmode="open">')
  })

  it('emits only the base classes in use plus per-element rules', () => {
    expect(css).toContain('.lc-heading {')
    expect(css).not.toContain('.lc-stack')
    expect(css).toMatch(/\.lc-root \.lc-n\d+ \{\n {2}color: #123abc;\n {2}font-size: 64px;/)
    expect(css).toContain('font-size: 5cqw;')
    expect(css).toContain('aspect-ratio: 960 / 540;')
  })

  it('drops empty images and builds a standalone page with a safe title', () => {
    expect(html.match(/class="lc-el /g)).toHaveLength(1)
    const page = file(files, 'page')
    expect(page).toMatch(/^<!doctype html>/)
    expect(page).toContain('<title>Launch &lt;hero></title>')
    expect(files.map((item) => item.filename)).toEqual(['launch-hero.html', 'launch-hero.css', 'launch-hero-page.html'])
  })
})

describe('input and shape content', () => {
  it('exports a form field and the words inside a shape', () => {
    const files = exportComposition(
      {
        root: { props: {} },
        content: [
          {
            type: 'Input',
            props: { id: 'i', label: 'Email', placeholder: 'you@example.com', value: 'ada@example.com', name: 'email', type: 'email' },
          },
          {
            type: 'FreeCanvas',
            props: {
              id: 'c',
              artboard: { width: 400, height: 400 },
              grid: { show: false, snap: false, size: 8 },
              elements: [
                {
                  id: 's',
                  kind: 'shape',
                  x: 0,
                  y: 0,
                  w: 120,
                  h: 120,
                  rotation: 0,
                  content: { shape: 'star', text: 'New' },
                },
              ],
            },
          },
        ],
      },
      'html',
      'Form',
    )
    const html = file(files, 'snippet')
    const css = file(files, 'css')

    expect(html).toContain('<span class="lc-field__label">Email</span>')
    expect(html).toContain('type="email"')
    expect(html).toContain('name="email"')
    expect(html).toContain('value="ada@example.com"')
    expect(html).toContain('>New</div>')
    expect(css).toContain('clip-path: polygon(')
  })
})

describe('Tailwind export', () => {
  const files = exportComposition(composition, 'tailwind', 'Launch')
  const html = file(files, 'snippet')
  const classOf = (marker: string) => {
    const line = html.split('\n').find((item) => item.includes(marker))!
    return /className="([^"]+)"/.exec(line)![1].split(' ')
  }

  it('merges base and custom styles so each property gets one utility', () => {
    const heading = classOf('Hello')
    expect(heading.filter((name) => name.startsWith('text-[color:'))).toEqual(['text-[color:#123abc]'])
    expect(heading.filter((name) => name.startsWith('text-[length:'))).toEqual(['text-[length:64px]'])

    const button = classOf('>Go<')
    expect(button.filter((name) => name.startsWith('bg-'))).toEqual(['bg-[#e36414]'])
    expect(button).not.toContain('hover:bg-[#5f0f40]')
    expect(button).toContain('hover:border-[color:#5f0f40]')
  })

  it('keeps the canvas scaling with container units and percentage positions', () => {
    expect(html).toContain('[container-type:inline-size]')
    expect(html).toContain('aspect-[960/540]')
    expect(html).toContain('rotate-[15deg]')
    expect(html).toContain('left-[10%]')
    expect(html).toContain('text-[length:5cqw]')
    expect(html).toContain('className="')
    expect(html).not.toMatch(/className="[^"]*lc-/)
  })

  it('clears a large rotation on the small screen with the rotate property', () => {
    const files = exportComposition(
      {
        root: { props: {} },
        content: [
          {
            type: 'FreeCanvas',
            props: {
              id: 'c',
              artboard: { width: 960, height: 540 },
              grid: { show: false, snap: false, size: 8 },
              elements: [
                {
                  id: 'card',
                  kind: 'shape',
                  x: 356,
                  y: 89,
                  w: 258,
                  h: 391,
                  rotation: 25,
                  content: { shape: 'rect' },
                  responsive: { small: { x: 138, y: 145, w: 212, h: 251, rotation: 0 } },
                },
              ],
            },
          },
        ],
      },
      'tailwind',
      'Card',
    )
    const snippet = file(files, 'snippet')
    expect(snippet).toContain('rotate-[25deg]')
    expect(snippet).toContain('max-[480px]:rotate-0')
    expect(snippet).not.toContain('max-[768px]:rotate-')
    expect(snippet).not.toContain('[transform:none]')
  })

  it('closes images and inputs so the snippet is valid JSX', () => {
    const files = exportComposition(
      {
        root: { props: {} },
        content: [
          { type: 'Image', props: { id: 'img', src: 'https://example.com/photo.png', alt: 'Photo' } },
          { type: 'Input', props: { id: 'i', label: 'Email', name: 'email', type: 'email' } },
        ],
      },
      'tailwind',
      'Fields',
    )
    const snippet = file(files, 'snippet')
    expect(snippet).toMatch(/<img\b[^>]*\/>/)
    expect(snippet).toMatch(/<input\b[^>]*\/>/)
    expect(snippet).not.toMatch(/<img\b[^>]*[^/]>/)
    expect(snippet).not.toMatch(/<input\b[^>]*[^/]>/)

    const page = file(files, 'page')
    expect(page).toContain('class="')
    expect(page).not.toContain('className=')
    expect(page).toMatch(/<img\b[^>]*>/)
    expect(page).not.toMatch(/<img\b[^>]*\/>/)
  })

  it('previews standalone through the Tailwind browser build', () => {
    expect(file(files, 'page')).toContain('@tailwindcss/browser@4')
    expect(files.map((item) => item.filename)).toEqual(['launch-tailwind.html', 'launch-tailwind-page.html'])
  })
})
