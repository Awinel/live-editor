import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export const getPayloadClient = () => getPayload({ config })

export async function getCurrentUser() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user
}

export const safeNextPath = (value: unknown, fallback = '/studio') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
