import { useCallback, useSyncExternalStore } from 'react'

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

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
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
