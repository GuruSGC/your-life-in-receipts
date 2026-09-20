import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export const ROUTES = [
  { id: 'receipt', path: '/', label: 'Receipt' },
  { id: 'story', path: '/story', label: 'Story' },
  { id: 'connections', path: '/connections', label: 'Connections' },
  { id: 'rhythms', path: '/rhythms', label: 'Rhythms' },
  { id: 'explore', path: '/explore', label: 'Explore' },
  { id: 'method', path: '/method', label: 'Method' },
] as const

export type RouteId = (typeof ROUTES)[number]['id']

export interface ParsedHash {
  route: RouteId
  params: URLSearchParams
}

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

export function useHashRoute(): ParsedHash & { navigate: (path: string) => void; hash: string } {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const navigate = useCallback((path: string) => {
    window.location.hash = path
  }, [])
  return { ...parseHash(hash), navigate, hash }
}
