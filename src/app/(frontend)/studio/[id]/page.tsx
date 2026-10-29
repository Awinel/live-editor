import '@puckeditor/core/puck.css'
import './studio.css'

import { notFound, redirect } from 'next/navigation'

import { isAdmin } from '@/access/roles'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import type { ComponentData } from '@/puck/config'

import { StudioEditor } from './StudioEditor'

export const metadata = { title: 'Editing component' }

export default async function StudioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/studio/${id}`)

  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()

  const payload = await getPayloadClient()
  const doc = await payload
    .findByID({
      collection: 'components',
      id: numericId,
      depth: 0,
      draft: true,
      user,
      overrideAccess: false,
    })
    .catch(() => null)
  if (!doc) notFound()

  const admin = isAdmin(user)
  if (!admin && doc._status === 'published') redirect(`/components/${doc.slug}`)

  const composition = (doc.composition ?? {}) as Partial<ComponentData>
  const initialData: ComponentData = {
    content: Array.isArray(composition.content) ? composition.content : [],
    root: { props: { title: doc.title, description: doc.description ?? '' } },
  }

  return <StudioEditor id={doc.id} initialData={initialData} isAdmin={admin} />
}
