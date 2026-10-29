import { clampMarkupHeight } from './blockTypes'

const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:"

const BASE_CSS =
  'html,body{margin:0}body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0F4C5C;line-height:1.5}'

function buildDocument(html: string, css: string) {
  const safeCss = css.replace(/<\/?\s*style/gi, '')
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>${BASE_CSS}</style><style>${safeCss}</style></head><body>${html}</body></html>`
}

type MarkupFrameProps = {
  html: string
  css: string
  height: number
  isEditing?: boolean
}

// Scripts stay off because the sandbox omits allow-scripts; the CSP blocks network fetches too.
export function MarkupFrame({ html, css, height, isEditing }: MarkupFrameProps) {
  return (
    <iframe
      className="lc-markup"
      sandbox=""
      referrerPolicy="no-referrer"
      title="Custom markup"
      srcDoc={buildDocument(html, css)}
      style={{ height: clampMarkupHeight(height), pointerEvents: isEditing ? 'none' : undefined }}
    />
  )
}
