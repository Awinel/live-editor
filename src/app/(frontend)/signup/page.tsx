import { AuthPage } from '@/components/site/AuthPage'

export const metadata = { title: 'Create account' }

export default function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="signup" searchParams={searchParams} />
}
