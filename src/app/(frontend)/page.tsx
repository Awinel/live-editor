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
                <Link
                  href={`/components/${featured.slug}`}
                  className="text-lg font-bold text-violet hover:underline"
                >
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
      <div className="flex flex-col gap-[16px] font-['Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-[length:16px] leading-[1.55] text-[color:#0f4c5c] text-left">
        <div className="relative w-full mx-auto [container-type:inline-size] overflow-hidden leading-[1.4] aspect-[960/540] max-w-[960px] bg-[#cccccc] text-[length:1.667cqw] min-[481px]:max-[768px]:aspect-[768/540] min-[481px]:max-[768px]:max-w-[768px] max-[480px]:aspect-[480/540] max-[480px]:max-w-[480px]">
          <div className="absolute origin-center left-[7.5%] top-[13.3333%] w-[85%] h-[75.5556%] min-[481px]:max-[768px]:left-[7.5521%] min-[481px]:max-[768px]:w-[85.026%]">
            <div
              className="flex w-full h-full m-0 [overflow-wrap:anywhere] items-center justify-center [padding:12%] text-center bg-[#ffffff] border-0 border-none rounded-[2.604cqw] shadow-[0cqw_0.833cqw_2.083cqw_0cqw_rgba(15,76,92,0.18)]"
              aria-hidden="true"
            ></div>
          </div>
          <div className="absolute origin-center left-[9.1667%] top-[15.5556%] w-[41.6667%] h-[71.1111%] min-[481px]:max-[768px]:left-[9.1146%]">
            <div
              className="flex w-full h-full m-0 [overflow-wrap:anywhere] items-center justify-center [padding:12%] text-center bg-[#fb8b24] rounded-tl-[2.604cqw] rounded-br-[0cqw] rounded-bl-[2.604cqw]"
              aria-hidden="true"
            ></div>
          </div>
          <div className="absolute origin-center left-[9.1667%] top-[15.5556%] w-[45%] h-[71.1111%] min-[481px]:max-[768px]:left-[9.1146%] min-[481px]:max-[768px]:w-[45.0521%] max-[480px]:w-[81.6667%]">
            <img
              className="block w-full h-full m-0 [overflow-wrap:anywhere] object-cover rounded-[2.604cqw]"
              src="https://plus.unsplash.com/premium_photo-1664037539510-826bbf2728d3?q=80&amp;w=785&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.1.0&amp;ixid=NHwxMjA3fDA%3D"
              alt=""
            />
          </div>
          <div className="absolute origin-center left-[37.0833%] top-[16.4815%] w-[26.875%] h-[72.4074%] rotate-[25deg] min-[481px]:max-[768px]:left-[36.9792%] min-[481px]:max-[768px]:top-[17.037%] min-[481px]:max-[768px]:w-[28.776%] max-[480px]:left-[28.75%] max-[480px]:top-[26.8519%] max-[480px]:w-[44.1667%] max-[480px]:h-[46.4815%] max-[480px]:rotate-0">
            <div
              className="flex w-full h-full m-0 [overflow-wrap:anywhere] items-center justify-center [padding:12%] text-center bg-[#ffffff] rounded-tl-[7.917cqw] rounded-br-[12.083cqw]"
              aria-hidden="true"
            ></div>
          </div>
          <div className="absolute origin-center left-[67.0833%] top-[52.4074%] w-[21.25%] h-[5.5556%] min-[481px]:max-[768px]:left-[67.0573%] min-[481px]:max-[768px]:w-[21.224%] max-[480px]:left-[39.375%] max-[480px]:top-[49.6296%] max-[480px]:h-[2.963%]">
            <label className="flex w-full h-full m-0 [overflow-wrap:anywhere] flex-col justify-center gap-[0.35em] bg-[#ffffff] text-[color:#0f4c5c] text-[length:1.354cqw] border-[length:0.104cqw] border-solid border-[color:#919191] rounded-[0.625cqw]">
              <input
                className="[flex:1] w-full min-h-[0] m-0 [padding:0_0.7em] border-0 bg-transparent text-[color:inherit] [font:inherit] [resize:none]"
                name="email"
                placeholder="you@example.com"
                type="email"
                value="Email"
              />
            </label>
          </div>
          <div className="absolute origin-center left-[67.0833%] top-[60%] w-[21.25%] h-[5.1852%] min-[481px]:max-[768px]:left-[67.0573%] min-[481px]:max-[768px]:w-[21.224%] max-[480px]:left-[39.375%] max-[480px]:top-[54.0741%] max-[480px]:h-[2.963%]">
            <label className="flex w-full h-full m-0 [overflow-wrap:anywhere] flex-col justify-center gap-[0.35em] bg-[#ffffff] text-[color:#0f4c5c] text-[length:1.354cqw] border-[length:0.104cqw] border-solid border-[color:#919191] rounded-[0.625cqw]">
              <input
                className="[flex:1] w-full min-h-[0] m-0 [padding:0_0.7em] border-0 bg-transparent text-[color:inherit] [font:inherit] [resize:none]"
                name="email"
                placeholder="you@example.com"
                type="email"
                value="Password"
              />
            </label>
          </div>
          <div className="absolute origin-center left-[67.0833%] top-[70.3704%] w-[21.25%] h-[6.6667%] min-[481px]:max-[768px]:left-[67.0573%] min-[481px]:max-[768px]:w-[21.224%] max-[480px]:left-[39.375%] max-[480px]:top-[61.4815%] max-[480px]:h-[2.963%]">
            <a
              className="flex w-full h-full m-0 [overflow-wrap:anywhere] items-center justify-center text-center no-underline font-semibold bg-[#9a031e] text-white text-[length:1.667cqw] rounded-[0.833cqw] focus-visible:[outline:3px_solid_#fb8b24] focus-visible:[outline-offset:2px]"
              href="#"
            >
              Login
            </a>
          </div>
          <div className="absolute origin-center left-[67.2917%] top-[31.8519%] w-[20.8333%] h-[5.1852%] min-[481px]:max-[768px]:left-[67.3177%] max-[480px]:left-[33.3333%] max-[480px]:top-[34.8148%] max-[480px]:w-[35%]">
            <h2 className="block w-full h-full m-0 [overflow-wrap:anywhere] font-bold leading-[1.05] text-[color:#5f0f40] text-[length:3.333cqw] text-center">
              Welcome back
            </h2>
          </div>
        </div>
      </div>
    </>
  )
}
