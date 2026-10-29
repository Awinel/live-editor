import { Render } from '@puckeditor/core'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { isAdmin } from '@/access/roles'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { config, type ComponentData } from '@/puck/config'
import { Bench } from '@/components/site/Bench'
import { DeleteComponentButton } from '@/components/site/DeleteComponentButton'
import { SiteHeader } from '@/components/site/SiteHeader'
import { StatusLabel } from '@/components/site/StatusLabel'

import { createComponent } from './actions'

export const metadata = { title: 'Studio' }

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

export default async function StudioPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/studio')

  const admin = isAdmin(user)
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'components',
    where: { author: { equals: user.id } },
    sort: '-updatedAt',
    depth: 0,
    limit: 100,
    draft: true,
    user,
    overrideAccess: false,
  })

  const pendingCount = admin
    ? (
        await payload.count({
          collection: 'components',
          where: { reviewStatus: { equals: 'pending' } },
        })
      ).totalDocs
    : 0

  return (
    <>
      <SiteHeader user={user} />
      <section className="mx-auto w-full max-w-6xl px-6 pt-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-violet">Your components</h1>
            <p className="mt-3 text-lg text-teal">
              {admin
                ? 'Anything you publish goes straight to the gallery.'
                : 'Drafts are private. Submit one when it is ready and an admin will review it.'}
            </p>
          </div>
          <form action={createComponent}>
            <button type="submit" className="btn btn-primary">
              New component
            </button>
          </form>
        </div>

        {admin && pendingCount > 0 && (
          <p className="mt-8 rounded-md border-l-4 border-leaf bg-paper px-4 py-3 text-teal">
            {pendingCount === 1 ? 'One component is' : `${pendingCount} components are`} waiting for
            review.{' '}
            <Link
              href="/admin/collections/components?where[reviewStatus][equals]=pending"
              className="link"
            >
              Open the review queue
            </Link>
          </p>
        )}

        {docs.length === 0 ? (
          <div className="mt-12 rounded-lg border-l-[10px] border-leaf bg-paper px-8 py-10">
            <h2 className="text-2xl font-bold text-violet">Your bench is empty</h2>
            <p className="mt-2 max-w-xl text-teal">
              Start a component, drop a few blocks on it, and save. It stays here until you decide
              to submit it.
            </p>
          </div>
        ) : (
          <ul className="mt-12 grid gap-10 md:grid-cols-2">
            {docs.map((doc) => {
              const editable = admin || doc._status !== 'published'
              return (
                <li key={doc.id} className="flex flex-col gap-4">
                  <Bench className="max-h-80 overflow-hidden">
                    <Render config={config} data={doc.composition as ComponentData} />
                  </Bench>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-violet">{doc.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <StatusLabel component={doc} />
                        <span className="text-sm text-muted">
                          Edited {dateFormat.format(new Date(doc.updatedAt))}
                        </span>
                      </div>
                      {doc.reviewStatus === 'rejected' && doc.reviewNote && (
                        <p className="mt-2 max-w-md text-sm text-teal">
                          <span className="font-semibold">Reviewer note:</span> {doc.reviewNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {doc._status === 'published' && (
                        <Link href={`/components/${doc.slug}`} className="link">
                          View
                        </Link>
                      )}
                      {editable && (
                        <Link href={`/studio/${doc.id}`} className="btn btn-secondary">
                          Edit
                        </Link>
                      )}
                      {editable && <DeleteComponentButton id={doc.id} title={doc.title} />}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
