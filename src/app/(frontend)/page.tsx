import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'

import config from '@/payload.config'
import './styles.css'
import BlackHole from '@/components/BlackHole'
import LucideIcon from '@/components/LucideIcon'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const siteSettings = await payload.findGlobal({
    slug: 'site-settings',
  })

  return (
    <BlackHole>
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <div className="flex flex-col items-center justify-center">
          <picture className="animate-iteration-count-infinite animate-float animate-duration-3000">
            <source srcSet="/logo.png" />
            <Image
              alt="Payload Logo"
              height={100}
              src="/logo.png"
              width={150}
              className="w-37.5 h-25 object-cover"
              loading="eager"
            />
          </picture>
          {!user && <h1>Welcome to your new PayloadCMS project.</h1>}
          {user && <h1>Welcome back, {user.email}</h1>}
        </div>
        <div className="text-center mb-4">
          <h3 className="my-4">This template includes:</h3>
          <ul className="flex gap-4 ">
            {siteSettings?.implementations?.map((implementation, index) => (
              <li
                className="flex items-center gap-2 py-2 px-4 rounded-md"
                style={{ backgroundColor: implementation.color ?? '#000000' }}
                key={index}
              >
                <LucideIcon name={implementation.icon ?? ''} className="size-4" />
                {implementation.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-4">
          <a
            className="bg-gray-900 my-3 px-4 py-2 rounded-md"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="bg-green-500 my-3 px-4 py-2 rounded-md"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
    </BlackHole>
  )
}
