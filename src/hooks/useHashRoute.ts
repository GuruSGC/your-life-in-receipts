import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { ROUTES, type RouteId } from '@/constants'

export interface ParsedHash {
  route: RouteId
  params: URLSearchParams
}

/** Turns a URL hash into a route and its query parameters, falling back to the home page. */
export function parseHash(hash: string): ParsedHash {
  const [pathPart = '', query = ''] = hash.replace(/^#/, '').split('?')
  const path = pathPart === '' ? '/' : pathPart
  const match = ROUTES.find((route) => route.path === path)
  return { route: match?.id ?? 'receipt', params: new URLSearchParams(query) }
}

/**
 * Route changes cross-fade with the View Transitions API where the browser has it and the reader has not asked
 * for reduced motion. Elsewhere the page simply changes.
 */
function subscribe(callback: () => void): () => void {
  const onChange = (): void => {
    const start = document.startViewTransition?.bind(document)
    if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      callback()
      return
    }
    start(() => {
      flushSync(callback)
    })
  }
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const snapshot = (): string => window.location.hash
const serverSnapshot = (): string => ''

/** The current route and query from the URL hash, with a navigate function. */
export function useHashRoute(): ParsedHash & { navigate: (path: string) => void; hash: string } {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const navigate = useCallback((path: string) => {
    window.location.hash = path
  }, [])
  return { ...parseHash(hash), navigate, hash }
}
