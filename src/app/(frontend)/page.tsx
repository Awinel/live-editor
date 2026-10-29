import { Render } from '@puckeditor/core'
import Link from 'next/link'

import { getFeaturedComponent } from '@/lib/components'
import { getCurrentUser } from '@/lib/payload'
import { config, type ComponentData } from '@/puck/config'
import { Bench } from '@/components/site/Bench'
import { SiteHeader } from '@/components/site/SiteHeader'

export default async function HomePage() {
  const [user, featured] = await Promise.all([getCurrentUser(), getFeaturedComponent()])

  return (
    <>
      <SiteHeader user={user} />
      <section className="mx-auto grid w-full max-w-6xl items-center gap-x-14 gap-y-12 px-6 pt-6 pb-20 lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
        <div>
          <h1 className="text-[clamp(2.5rem,1.7rem+3vw,4rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-violet">
            Build a component while it renders in front of you.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-teal">
            Drop in headings, text, images, buttons, or your own markup, then send it for review.
            Approved components go up in the public gallery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? '/studio' : '/signup'} className="btn btn-primary">
              Start a component
            </Link>
            <Link href="/components" className="btn btn-secondary">
              Browse the gallery
            </Link>
          </div>
          <p className="mt-5 text-[0.9375rem] text-muted">
            {user
              ? 'Your drafts stay private until you submit them.'
              : 'Free account. Your drafts stay private until you submit them.'}
          </p>
        </div>

        <figure className="m-0">
          {featured ? (
            <>
              <Bench selected tab="Featured" className="pt-12 sm:pt-14">
                <Render config={config} data={featured.composition as ComponentData} />
              </Bench>
              <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/components/${featured.slug}`} className="text-lg font-bold text-violet hover:underline">
                  {featured.title}
                </Link>
                {featured.authorName && (
                  <span className="text-[0.9375rem] text-muted">by {featured.authorName}</span>
                )}
              </figcaption>
            </>
          ) : (
            <Bench className="pt-12 sm:pt-14">
              <div className="rounded-md border-l-[10px] border-leaf px-6 py-10">
                <p className="text-2xl font-bold text-violet">Nothing has been approved yet.</p>
                <p className="mt-2 text-teal">
                  The first featured component will sit right here on the bench.
                </p>
              </div>
            </Bench>
          )}
        </figure>
      </section>
    </>
  )
}
