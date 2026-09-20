import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { AppHeader } from '@/shared/components/AppHeader'
import { DayDrawer } from '@/shared/components/DayDrawer'
import { DataProvider } from '@/shared/context/DataContext'
import { DrawerProvider } from '@/shared/context/DrawerContext'
import { useHashRoute, type RouteId } from '@/shared/hooks/useHashRoute'
import { ErrorBoundary } from './ErrorBoundary'

const PAGES: Record<RouteId, LazyExoticComponent<ComponentType>> = {
  receipt: lazy(() => import('@/pages/HomePage')),
  story: lazy(() => import('@/pages/StoryPage')),
  connections: lazy(() => import('@/pages/ConnectionsPage')),
  rhythms: lazy(() => import('@/pages/RhythmsPage')),
  explore: lazy(() => import('@/pages/ExplorePage')),
  method: lazy(() => import('@/pages/MethodPage')),
}

function Shell() {
  const { route } = useHashRoute()
  const Page = PAGES[route]
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AppHeader current={route} />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-14 md:pt-10">
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

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <DrawerProvider>
          <Shell />
        </DrawerProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
