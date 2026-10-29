import type { Access, CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'
import { slugField } from 'payload'

type Slugify = NonNullable<NonNullable<Parameters<typeof slugField>[0]>['slugify']>

import { admins, authenticated, isAdmin, isTrustedServerCall } from '../access/roles'
import { emptyComposition } from '../puck/blockTypes'
import { sanitizeComposition } from '../puck/sanitize'

const MAX_COMPOSITION_BYTES = 200_000

const isPublished: Where = { _status: { equals: 'published' } }

const readComponents: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true
  if (!user) return isPublished
  const ownComponent: Where = { author: { equals: user.id } }
  return { or: [isPublished, ownComponent] }
}

const adminsOrOwnDraft: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true
  if (!user) return false
  const ownComponent: Where = { author: { equals: user.id } }
  const notPublished: Where = { _status: { not_equals: 'published' } }
  return { and: [ownComponent, notPublished] }
}

const toSlug = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'component'

// Titles repeat ("Untitled component"), so slugs carry a short suffix that survives later saves.
const uniqueSlug: Slugify = ({ data, valueToSlugify }) => {
  const base = toSlug(valueToSlugify)
  const current = typeof data?.slug === 'string' ? data.slug : ''
  const match = current.match(/^(.*)-([a-z0-9]{6})$/)
  if (match && match[1] === base) return current
  return `${base}-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`
}

const enforceReviewRules: CollectionBeforeChangeHook = ({ data, req, operation, originalDoc }) => {
  if (data.composition !== undefined) {
    data.composition = sanitizeComposition(data.composition)
  }

  if (isTrustedServerCall(req) || isAdmin(req.user)) {
    if (operation === 'create' && !data.author && req.user) data.author = req.user.id
    if (data._status === 'published') data.reviewStatus = 'approved'
    return data
  }

  const user = req.user
  if (!user) return data

  data.author = operation === 'create' ? user.id : originalDoc?.author
  data._status = 'draft'
  data.featured = operation === 'create' ? false : Boolean(originalDoc?.featured)
  data.reviewNote = operation === 'create' ? null : (originalDoc?.reviewNote ?? null)

  const requested = data.reviewStatus
  const wasRejected = originalDoc?.reviewStatus === 'rejected'
  data.reviewStatus =
    requested === 'pending'
      ? 'pending'
      : requested === 'rejected' && wasRejected
        ? 'rejected'
        : 'private'

  return data
}

export const Components: CollectionConfig = {
  slug: 'components',
  labels: { singular: 'Component', plural: 'Components' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'reviewStatus', '_status', 'featured', 'updatedAt'],
    description:
      'Publishing a component puts it in the public gallery. Tick Featured to show it on the landing page.',
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    create: authenticated,
    read: readComponents,
    readVersions: admins,
    update: adminsOrOwnDraft,
    delete: adminsOrOwnDraft,
  },
  hooks: {
    beforeChange: [enforceReviewRules],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 80 },
    slugField({ slugify: uniqueSlug }),
    { name: 'description', type: 'textarea', maxLength: 280 },
    {
      name: 'composition',
      type: 'json',
      required: true,
      defaultValue: emptyComposition(),
      validate: (value: unknown) => {
        if (typeof value !== 'object' || value === null) return 'The component is empty.'
        if (JSON.stringify(value).length > MAX_COMPOSITION_BYTES) {
          return 'This component is too large to save. Remove some blocks and try again.'
        }
        return true
      },
      admin: {
        components: {
          Field: '/components/admin/PuckField#PuckField',
        },
      },
    },
    {
      name: 'reviewNote',
      type: 'textarea',
      maxLength: 500,
      admin: { description: 'Shown to the author when a component is sent back.' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Waiting for review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Sent back', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show on the landing page once published.',
      },
    },
  ],
}
