import Link from 'next/link'

import type { User } from '@/payload-types'
import { isAdmin } from '@/access/roles'

import { SignOutButton } from './SignOutButton'

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-6">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-violet no-underline">
        Live editor
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem]">
        <Link href="/components" className="font-semibold text-teal hover:text-violet">
          Gallery
        </Link>
        {user ? (
          <>
            <Link href="/studio" className="font-semibold text-teal hover:text-violet">
              Studio
            </Link>
            {isAdmin(user) && (
              <Link href="/admin" className="font-semibold text-teal hover:text-violet">
                Admin
              </Link>
            )}
            <span className="text-muted">{user.name || user.email}</span>
            <SignOutButton />
          </>
        ) : (
          <Link href="/login" className="font-semibold text-teal hover:text-violet">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  )
}
