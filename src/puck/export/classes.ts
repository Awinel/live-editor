export type Decls = Record<string, string>

export type ClassDef = { base: Decls; hover?: Decls; focusVisible?: Decls }

export const FONT_STACK = "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"

export const FONT_LINKS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap">',
]

const focusRing: Decls = { outline: '3px solid #fb8b24', 'outline-offset': '2px' }

/** Mirrors the public part of src/puck/blocks.css; keep the two in sync when block styling changes. */
export const CLASS_DEFS: Record<string, ClassDef> = {
  'lc-root': {
    base: {
      display: 'flex',
      'flex-direction': 'column',
      gap: '16px',
      'font-family': FONT_STACK,
      'font-size': '16px',
      'line-height': '1.55',
      color: '#0f4c5c',
      'text-align': 'left',
    },
  },
  'lc-heading': {
    base: {
      margin: '0',
      'font-weight': '700',
      'line-height': '1.1',
      'letter-spacing': '-0.02em',
      color: '#5f0f40',
    },
  },
  'lc-heading--h2': { base: { 'font-size': 'clamp(1.75rem, 1.25rem + 1.6vw, 2.5rem)' } },
  'lc-heading--h3': { base: { 'font-size': '1.375rem', 'line-height': '1.2' } },
  'lc-text': {
    base: {
      margin: '0',
      'max-width': '65ch',
      'font-size': '1.0625rem',
      'white-space': 'pre-line',
      color: '#0f4c5c',
    },
  },
  'lc-text--muted': { base: { color: '#3d6a76' } },
  'lc-align--center': { base: { 'text-align': 'center', 'margin-inline': 'auto' } },
  'lc-image': {
    base: {
      display: 'block',
      width: '100%',
      height: 'auto',
      'border-radius': '6px',
      'object-fit': 'cover',
    },
  },
  'lc-button': {
    base: {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'align-self': 'flex-start',
      'min-height': '44px',
      'padding-inline': '20px',
      'border-width': '2px',
      'border-style': 'solid',
      'border-color': '#9a031e',
      'border-radius': '6px',
      'font-size': '1rem',
      'font-weight': '600',
      'text-decoration': 'none',
      transition: 'background-color 120ms ease, border-color 120ms ease',
    },
    focusVisible: focusRing,
  },
  'lc-button--solid': {
    base: { background: '#9a031e', color: '#ffffff' },
    hover: { background: '#5f0f40', 'border-color': '#5f0f40' },
  },
  'lc-button--outline': {
    base: { background: 'transparent', color: '#9a031e' },
    hover: { background: 'rgba(154, 3, 30, 0.08)' },
  },
  'lc-stack': { base: { display: 'flex' } },
  'lc-stack--vertical': { base: { 'flex-direction': 'column' } },
  'lc-stack--horizontal': { base: { 'flex-direction': 'row', 'flex-wrap': 'wrap' } },
  'lc-gap--sm': { base: { gap: '8px' } },
  'lc-gap--md': { base: { gap: '16px' } },
  'lc-gap--lg': { base: { gap: '32px' } },
  'lc-items--start': { base: { 'align-items': 'flex-start' } },
  'lc-items--center': { base: { 'align-items': 'center' } },
  'lc-items--stretch': { base: { 'align-items': 'stretch' } },
  'lc-markup': { base: { display: 'block', width: '100%' } },
  'lc-canvas': {
    base: {
      position: 'relative',
      width: '100%',
      'margin-inline': 'auto',
      'container-type': 'inline-size',
      overflow: 'hidden',
      'line-height': '1.4',
    },
  },
  'lc-el': { base: { position: 'absolute', 'transform-origin': 'center' } },
  'lc-el-body': {
    base: {
      display: 'block',
      width: '100%',
      height: '100%',
      margin: '0',
      'overflow-wrap': 'anywhere',
    },
  },
  'lc-el-heading': { base: { 'font-weight': '700', 'line-height': '1.1', color: '#5f0f40' } },
  'lc-el-text': { base: { 'white-space': 'pre-line' } },
  'lc-el-button': {
    base: {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'text-align': 'center',
      'text-decoration': 'none',
      'font-weight': '600',
      background: '#9a031e',
      color: '#ffffff',
    },
    focusVisible: focusRing,
  },
  'lc-el-image': { base: { 'object-fit': 'cover' } },
  'lc-field': {
    base: { display: 'grid', gap: '6px', 'align-self': 'flex-start', width: 'min(100%, 360px)' },
  },
  'lc-field__label': { base: { 'font-size': '0.875rem', 'font-weight': '600', 'line-height': '1.3' } },
  'lc-field__control': {
    base: {
      width: '100%',
      'min-height': '44px',
      margin: '0',
      padding: '8px 12px',
      'border-width': '2px',
      'border-style': 'solid',
      'border-color': '#0f4c5c',
      'border-radius': '6px',
      background: '#ffffff',
      color: '#0f4c5c',
      font: 'inherit',
    },
    focusVisible: focusRing,
  },
  'lc-el-shape': {
    base: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', padding: '12%', 'text-align': 'center' },
  },
  'lc-el-input': { base: { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center', gap: '0.35em' } },
  'lc-el-input__label': { base: { 'font-size': '0.75em', 'font-weight': '600', 'line-height': '1.2' } },
  'lc-el-input__control': {
    base: {
      flex: '1',
      width: '100%',
      'min-height': '0',
      margin: '0',
      padding: '0 0.7em',
      'border-width': '0',
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
      resize: 'none',
    },
  },
}
