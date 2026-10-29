'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const signOut = async () => {
    setBusy(true)
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className="link cursor-pointer">
      Sign out
    </button>
  )
}
