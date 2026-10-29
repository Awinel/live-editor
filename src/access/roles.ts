import type { Access, FieldAccess, PayloadRequest } from 'payload'

type RoleBearer = { roles?: (string | null)[] | null } | null | undefined

export const isAdmin = (user: unknown): boolean =>
  Boolean((user as RoleBearer)?.roles?.includes('admin'))

// Local API calls without a user come from our own server code (seeds, onInit, scripts).
export const isTrustedServerCall = (req: PayloadRequest): boolean =>
  req.payloadAPI === 'local' && !req.user

export const admins: Access = ({ req }) => isAdmin(req.user)

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

export const adminField: FieldAccess = ({ req }) => isAdmin(req.user)
