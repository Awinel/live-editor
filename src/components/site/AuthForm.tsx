'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Mode = 'login' | 'signup'

type PayloadErrorBody = {
  errors?: Array<{ message?: string; data?: { errors?: Array<{ message?: string }> } }>
}

const readError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => ({}))) as PayloadErrorBody
  const first = body.errors?.[0]
  return first?.data?.errors?.[0]?.message ?? first?.message ?? fallback
}

const login = (email: string, password: string) =>
  fetch('/api/users/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'
  const submitLabel = isSignup ? 'Create account' : 'Sign in'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()

    setBusy(true)
    setError(null)

    if (isSignup) {
      const created = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })
      if (!created.ok) {
        setError(await readError(created, 'Could not create the account. Check the details and try again.'))
        setBusy(false)
        return
      }
    }

    const response = await login(email, password)
    if (!response.ok) {
      setError(await readError(response, 'The email or password is incorrect.'))
      setBusy(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  const altHref = `${isSignup ? '/login' : '/signup'}?next=${encodeURIComponent(next)}`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSignup && (
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold text-teal">Display name</span>
          <input name="name" type="text" maxLength={60} autoComplete="nickname" className="field-input" />
          <span className="text-sm text-muted">Shown next to components you publish.</span>
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold text-teal">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field-input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold text-teal">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="field-input"
        />
        {isSignup && <span className="text-sm text-muted">At least 8 characters.</span>}
      </label>

      {error && (
        <p role="alert" className="rounded-md border-l-4 border-crimson bg-paper px-4 py-3 font-medium text-crimson">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary self-start" disabled={busy}>
        {busy ? (isSignup ? 'Creating account…' : 'Signing in…') : submitLabel}
      </button>

      <p className="text-muted">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <Link href={altHref} className="link">
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  )
}
