'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { isAdmin } from '@/access/roles'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { emptyComposition } from '@/puck/blockTypes'

export type SaveIntent = 'save' | 'submit' | 'publish'
export type SaveResult = { ok: true; message: string } | { ok: false; message: string }

const SUCCESS: Record<SaveIntent, string> = {
  save: 'Draft saved',
  submit: 'Submitted for review',
  publish: 'Published',
}

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function createComponent() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/studio')

  const payload = await getPayloadClient()
  const doc = await payload.create({
    collection: 'components',
    data: {
      title: 'Untitled component',
      composition: emptyComposition(),
      reviewStatus: 'private',
      _status: 'draft',
    },
    draft: true,
    user,
    overrideAccess: false,
  })

  redirect(`/studio/${doc.id}`)
}

export async function saveComponent(
  id: number,
  composition: unknown,
  intent: SaveIntent,
): Promise<SaveResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Your session ended. Sign in again to save.' }

  const admin = isAdmin(user)
  if (intent === 'publish' && !admin) {
    return { ok: false, message: 'Only admins can publish. Submit it for review instead.' }
  }

  const payload = await getPayloadClient()

  const existing = await payload
    .findByID({ collection: 'components', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!existing) return { ok: false, message: 'This component no longer exists or is not yours to edit.' }

  const data = (composition ?? {}) as { content?: unknown; root?: { props?: Record<string, unknown> } }
  const rootProps = data.root?.props ?? {}

  try {
    await payload.update({
      collection: 'components',
      id,
      data: {
        title: text(rootProps.title, 80) || 'Untitled component',
        // Keep the slug following the title until the component goes live, so public URLs stay put.
        generateSlug: existing._status !== 'published',
        description: text(rootProps.description, 280) || null,
        composition: { content: Array.isArray(data.content) ? data.content : [], root: { props: {} } },
        reviewStatus: intent === 'submit' ? 'pending' : existing.reviewStatus,
        _status: intent === 'publish' ? 'published' : 'draft',
      },
      // Drafts of a live component go to a version so the published copy stays untouched.
      draft: intent !== 'publish' && existing._status === 'published',
      user,
      overrideAccess: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return { ok: false, message: message || 'Could not save. Try again in a moment.' }
  }

  revalidatePath('/studio')
  if (intent === 'publish') {
    revalidatePath('/')
    revalidatePath('/components')
  }

  return { ok: true, message: SUCCESS[intent] }
}

export async function deleteComponent(id: number) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/studio')

  const payload = await getPayloadClient()
  await payload.delete({ collection: 'components', id, user, overrideAccess: false }).catch(() => null)

  revalidatePath('/studio')
}
