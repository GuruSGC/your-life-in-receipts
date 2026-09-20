import { Suspense, type MouseEvent } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { DayDrawer } from '@/components/DayDrawer'
import { useHashRoute } from '@/hooks/useHashRoute'
import { PAGES } from '@/routes'

/** The hash belongs to the router, so move focus instead of letting the link change the route. */
function skipToContent(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault()
  document.getElementById('main')?.focus()
}

/** The frame around every page: skip link, header, the current page, footer and the day drawer. */
export function AppLayout() {
  const { route } = useHashRoute()
  const Page = PAGES[route]
  return (
    <>
      <a href="#main" className="skip-link" onClick={skipToContent}>
        Skip to content
      </a>
      <AppHeader current={route} />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto min-h-[100dvh] max-w-6xl px-4 pb-28 pt-6 outline-none md:px-6 md:pb-14 md:pt-10"
      >
        <Suspense
          fallback={
            <p role="status" className="mono text-sm text-ink-3">
              Loading…
            </p>
          }
        >
          <div key={route} className="page-enter">
            <Page />
          </div>
        </Suspense>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-24 text-sm text-ink-3 md:px-6 md:pb-10">
        <p>
          Every receipt on this page is fictional data from the WebRush hackathon. Times are shown
          as recorded.{' '}
          <a className="text-accent underline underline-offset-4" href="#/method">
            How this was made
          </a>
          .
        </p>
      </footer>
      <DayDrawer />
    </>
  )
}
