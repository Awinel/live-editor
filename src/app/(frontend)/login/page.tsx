import { AuthPage } from '@/components/site/AuthPage'

export const metadata = { title: 'Sign in' }

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="login" searchParams={searchParams} />
}
