import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  fields: [
    {
      name: 'implementations',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'color',
          type: 'text',
        },
        {
          name: 'icon',
          type: 'text',
          admin: {
            description: 'Lucide icon name in PascalCase (e.g. Database, Cloud, Zap)',
          },
        },
      ],
    },
  ],
}
