import { Render } from '@puckeditor/core'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { isAdmin } from '@/access/roles'
import { getPublishedComponent } from '@/lib/components'
import { getCurrentUser } from '@/lib/payload'
import { config, type ComponentData } from '@/puck/config'
import { Bench } from '@/components/site/Bench'
import { PublishedExportButton } from '@/components/site/PublishedExportButton'
import { SiteHeader } from '@/components/site/SiteHeader'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const component = await getPublishedComponent((await params).slug)
  return component
    ? { title: component.title, description: component.description ?? undefined }
    : { title: 'Component not found' }
}

export default async function ComponentPage({ params }: PageProps) {
  const { slug } = await params
  const [user, component] = await Promise.all([getCurrentUser(), getPublishedComponent(slug)])
  if (!component) notFound()

  return (
    <>
      <SiteHeader user={user} />
      <article className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20">
        <Link href="/components" className="link">
          Back to the gallery
        </Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-violet">{component.title}</h1>
            {component.description && <p className="mt-3 text-lg text-teal">{component.description}</p>}
            {component.authorName && <p className="mt-2 text-muted">by {component.authorName}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <PublishedExportButton slug={slug} />
            {isAdmin(user) && (
              <Link href={`/studio/${component.id}`} className="btn btn-secondary">
                Edit in studio
              </Link>
            )}
          </div>
        </header>
        <Bench selected={Boolean(component.featured)} tab="Featured" className="mt-10 pt-12 sm:pt-14">
          <Render config={config} data={component.composition as ComponentData} />
        </Bench>
      </article>
    </>
  )
}
