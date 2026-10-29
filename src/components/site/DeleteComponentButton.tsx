'use client'

import { useTransition } from 'react'

import { deleteComponent } from '@/app/(frontend)/studio/actions'

export function DeleteComponentButton({ id, title }: { id: number; title: string }) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return
    startTransition(() => deleteComponent(id))
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="link cursor-pointer">
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
