import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { RouteId } from '@/hooks/useHashRoute'

/** Every page is its own chunk, fetched the first time it is visited. */
export const PAGES: Record<RouteId, LazyExoticComponent<ComponentType>> = {
  receipt: lazy(() => import('@/pages/HomePage')),
  story: lazy(() => import('@/pages/StoryPage')),
  connections: lazy(() => import('@/pages/ConnectionsPage')),
  rhythms: lazy(() => import('@/pages/RhythmsPage')),
  explore: lazy(() => import('@/pages/ExplorePage')),
  method: lazy(() => import('@/pages/MethodPage')),
}
