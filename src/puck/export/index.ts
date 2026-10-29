import { sanitizeComposition } from '../sanitize'
import { FONT_LINKS } from './classes'
import { emitHtmlCss, emitTailwind } from './emit'
import { buildTree } from './tree'

export const EXPORT_FORMATS = ['html', 'tailwind'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export type ExportFile = {
  id: 'snippet' | 'css' | 'page'
  label: string
  filename: string
  mime: 'text/html' | 'text/css'
  content: string
}

const TAILWIND_BROWSER = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'

const escapeTitle = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const fileStem = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 60) || 'component'

function page(title: string, head: string[], bodyOpen: string, mainOpen: string, snippet: string) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeTitle(title)}</title>`,
    ...FONT_LINKS.map((link) => `  ${link}`),
    ...head.map((line) => `  ${line}`),
    '</head>',
    bodyOpen,
    mainOpen,
    snippet,
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n')
}

/** Turns stored or in-editor component data into standalone files; the data is sanitized again first. */
export function exportComposition(raw: unknown, format: ExportFormat, title: string): ExportFile[] {
  const tree = buildTree(sanitizeComposition(raw))
  const stem = fileStem(title)

  if (format === 'tailwind') {
    const { html, css } = emitTailwind(tree)
    const keyframes: ExportFile[] = css
      ? [{ id: 'css', label: 'Keyframes', filename: `${stem}-animations.css`, mime: 'text/css', content: `${css}\n` }]
      : []
    return [
      { id: 'snippet', label: 'Component', filename: `${stem}-tailwind.html`, mime: 'text/html', content: `${html}\n` },
      ...keyframes,
      {
        id: 'page',
        label: 'Full page',
        filename: `${stem}-tailwind-page.html`,
        mime: 'text/html',
        content: page(
          title,
          [
            '<!-- Tailwind browser build for previewing. In a project, compile the classes with Tailwind v4 or v3.3+ instead. -->',
            `<script src="${TAILWIND_BROWSER}"></script>`,
            ...(css ? ['<!-- Keyframes for the animate-[] classes. In a project, add them to your global CSS. -->', '<style>', css, '</style>'] : []),
          ],
          '<body class="m-0 bg-[#f7fbfc] px-4 py-8">',
          '<main class="mx-auto max-w-[1040px]">',
          html,
        ),
      },
    ]
  }

  const { html, css } = emitHtmlCss(tree)
  const pageCss = `body {\n  margin: 0;\n  padding: 32px 16px;\n  background: #f7fbfc;\n}\n\n.lc-page {\n  max-width: 1040px;\n  margin: 0 auto;\n}\n\n${css}`
  return [
    { id: 'snippet', label: 'HTML', filename: `${stem}.html`, mime: 'text/html', content: `${html}\n` },
    { id: 'css', label: 'CSS', filename: `${stem}.css`, mime: 'text/css', content: `${css}\n` },
    {
      id: 'page',
      label: 'Full page',
      filename: `${stem}-page.html`,
      mime: 'text/html',
      content: page(title, ['<style>', pageCss, '</style>'], '<body>', '<main class="lc-page">', html),
    },
  ]
}
