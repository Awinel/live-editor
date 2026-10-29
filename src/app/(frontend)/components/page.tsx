import { Render } from '@puckeditor/core'
import Link from 'next/link'

import { getPublishedComponents } from '@/lib/components'
import { getCurrentUser } from '@/lib/payload'
import { config, type ComponentData } from '@/puck/config'
import { Bench } from '@/components/site/Bench'
import { SiteHeader } from '@/components/site/SiteHeader'

export const metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const [user, components] = await Promise.all([getCurrentUser(), getPublishedComponents()])

  return (
    <>
      <SiteHeader user={user} />
      <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20">
        <h1 className="text-4xl font-bold tracking-tight text-violet">Gallery</h1>
        <p className="mt-3 max-w-2xl text-lg text-teal">
          Every component here was reviewed and published. Featured ones come first and appear on
          the home page.
        </p>

        {components.length === 0 ? (
          <div className="mt-12 rounded-lg border-l-[10px] border-leaf bg-paper px-8 py-10">
            <h2 className="text-2xl font-bold text-violet">No components have been published yet</h2>
            <p className="mt-2 max-w-xl text-teal">
              Build one in the studio and submit it for review. Once it is approved it shows up
              here.
            </p>
            <Link href={user ? '/studio' : '/signup'} className="btn btn-primary mt-6">
              Start a component
            </Link>
          </div>
        ) : (
          <ul className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-2">
            {components.map((component) => (
              <li key={component.id} className="flex flex-col gap-4">
                <Bench
                  selected={Boolean(component.featured)}
                  tab="Featured"
                  className={component.featured ? 'pt-12 sm:pt-14' : ''}
                >
                  <Render config={config} data={component.composition as ComponentData} />
                </Bench>
                <div>
                  <h2 className="text-xl font-bold text-violet">
                    <Link href={`/components/${component.slug}`} className="hover:underline">
                      {component.title}
                    </Link>
                  </h2>
                  {component.description && (
                    <p className="mt-1 max-w-prose text-teal">{component.description}</p>
                  )}
                  {component.authorName && (
                    <p className="mt-1 text-sm text-muted">by {component.authorName}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
