import { redirect } from 'next/navigation'

import { getCurrentUser, safeNextPath } from '@/lib/payload'

import { AuthForm } from './AuthForm'
import { SiteHeader } from './SiteHeader'

type AuthPageProps = {
  mode: 'login' | 'signup'
  searchParams: Promise<{ next?: string }>
}

export async function AuthPage({ mode, searchParams }: AuthPageProps) {
  const next = safeNextPath((await searchParams).next)
  const user = await getCurrentUser()
  if (user) redirect(next)

  return (
    <>
      <SiteHeader user={null} />
      <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-20">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-violet">
            {mode === 'signup' ? 'Create your account' : 'Sign in'}
          </h1>
          <p className="mt-3 mb-8 text-lg text-teal">
            {mode === 'signup'
              ? 'You get a private studio. Nothing goes public until it is reviewed.'
              : 'Pick up where you left off in your studio.'}
          </p>
          <AuthForm mode={mode} next={next} />
        </div>
      </section>
    </>
  )
}
