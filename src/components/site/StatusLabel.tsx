import type { Component } from '@/payload-types'

type Status = { label: string; dot: string }

export function describeStatus(component: Pick<Component, '_status' | 'reviewStatus'>): Status {
  if (component._status === 'published') return { label: 'Published', dot: 'bg-teal' }
  switch (component.reviewStatus) {
    case 'pending':
      return { label: 'Waiting for review', dot: 'bg-leaf' }
    case 'rejected':
      return { label: 'Sent back', dot: 'bg-crimson' }
    case 'approved':
      return { label: 'Unpublished', dot: 'bg-muted' }
    default:
      return { label: 'Private draft', dot: 'border-2 border-muted bg-transparent' }
  }
}

export function StatusLabel({ component }: { component: Pick<Component, '_status' | 'reviewStatus'> }) {
  const { label, dot } = describeStatus(component)
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal">
      <span aria-hidden className={`inline-block size-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
