const LINK_PROTOCOLS = ['http:', 'https:', 'mailto:']
const IMAGE_PROTOCOLS = ['http:', 'https:']

function isRelative(value: string) {
  return (value.startsWith('/') && !value.startsWith('//')) || value.startsWith('#')
}

function hasProtocol(value: string, protocols: string[]) {
  try {
    return protocols.includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function safeHref(value: string | undefined): string {
  const href = (value ?? '').trim()
  if (isRelative(href) || hasProtocol(href, LINK_PROTOCOLS)) return href
  return '#'
}

/** A form control name: a letter, then letters, digits, underscores, dots or hyphens. */
export function safeFieldName(value: string | undefined): string | undefined {
  const name = (value ?? '').trim().slice(0, 64)
  return /^[A-Za-z][\w.-]*$/.test(name) ? name : undefined
}

export function safeSrc(value: string | undefined): string | null {
  const src = (value ?? '').trim()
  if ((src.startsWith('/') && !src.startsWith('//')) || hasProtocol(src, IMAGE_PROTOCOLS)) return src
  return null
}
