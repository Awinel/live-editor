// Other imports
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Components } from './collections/Components'

// Plugins
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  globals: [SiteSettings],
  collections: [Users, Media, Components],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  sharp,
  plugins: [],
  // Accounts created before roles existed would otherwise lose admin access, so promote them once.
  onInit: async (payload) => {
    const { totalDocs: adminCount } = await payload.count({
      collection: 'users',
      where: { roles: { in: ['admin'] } },
    })
    if (adminCount > 0) return

    const { docs } = await payload.find({ collection: 'users', depth: 0, pagination: false })
    for (const user of docs) {
      await payload.update({ collection: 'users', id: user.id, data: { roles: ['admin'] } })
    }
    if (docs.length > 0) {
      payload.logger.info(`Promoted ${docs.length} existing user(s) to admin.`)
    }
  },
})
