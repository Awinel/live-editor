import type { CollectionConfig, FieldHook } from 'payload'

import { adminField, admins, adminsOrSelf, isAdmin, isTrustedServerCall } from '../access/roles'

const protectRoles: FieldHook = async ({ req, value, operation, originalDoc }) => {
  if (isTrustedServerCall(req) || isAdmin(req.user)) return value

  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({ collection: 'users', req })
    return totalDocs === 0 ? ['admin'] : ['user']
  }

  return originalDoc?.roles ?? ['user']
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'createdAt'],
  },
  auth: true,
  access: {
    admin: ({ req }) => isAdmin(req.user),
    create: () => true,
    read: adminsOrSelf,
    update: adminsOrSelf,
    delete: admins,
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
      maxLength: 60,
      admin: { description: 'Shown next to published components.' },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      saveToJWT: true,
      defaultValue: ['user'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      access: { update: adminField },
      hooks: { beforeChange: [protectRoles] },
      admin: { position: 'sidebar' },
    },
  ],
}
