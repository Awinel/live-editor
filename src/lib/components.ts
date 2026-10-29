import type { Where } from 'payload'

import type { Component } from '@/payload-types'

import { getPayloadClient } from './payload'

export type PublicComponent = Component & { authorName: string | null }

// Public pages read as an anonymous visitor so access control limits results to published docs.
async function findPublished(where: Where | undefined, limit: number): Promise<PublicComponent[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'components',
    where,
    sort: ['-featured', '-updatedAt'],
    limit,
    depth: 0,
    overrideAccess: false,
  })

  const authorIds = [...new Set(docs.map((doc) => doc.author).filter((id): id is number => typeof id === 'number'))]
  const names = new Map<number, string>()
  if (authorIds.length > 0) {
    // Only the display name leaves the users collection; emails stay private.
    const { docs: authors } = await payload.find({
      collection: 'users',
      where: { id: { in: authorIds } },
      select: { name: true },
      depth: 0,
      pagination: false,
    })
    for (const author of authors) if (author.name) names.set(author.id, author.name)
  }

  return docs.map((doc) => ({
    ...doc,
    authorName: typeof doc.author === 'number' ? (names.get(doc.author) ?? null) : null,
  }))
}

export async function getFeaturedComponent() {
  const [doc] = await findPublished({ featured: { equals: true } }, 1)
  return doc ?? null
}

export const getPublishedComponents = () => findPublished(undefined, 60)

export async function getPublishedComponent(slug: string) {
  const [doc] = await findPublished({ slug: { equals: slug } }, 1)
  return doc ?? null
}
