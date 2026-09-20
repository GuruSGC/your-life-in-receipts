import { MAX_SEARCH_LENGTH, THEMES, type Theme } from '@/constants'
import { DEFAULT_FILTERS, type Filters } from './search'

const isTheme = (value: string | null): value is Theme => THEMES.some((theme) => theme === value)

/** Reads the search text, theme and scrapbook filter from URL query parameters, ignoring anything invalid. */
export function filtersFromParams(params: URLSearchParams): Filters {
  const theme = params.get('theme')
  return {
    ...DEFAULT_FILTERS,
    query: (params.get('q') ?? '').slice(0, MAX_SEARCH_LENGTH),
    theme: isTheme(theme) ? theme : 'all',
    pinnedOnly: params.get('pinned') === '1',
  }
}

/** The query string that reproduces the shareable parts of a set of filters. Empty when they are the defaults. */
export function paramsFromFilters(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.query.trim()) params.set('q', filters.query.trim())
  if (filters.theme !== 'all') params.set('theme', filters.theme)
  if (filters.pinnedOnly) params.set('pinned', '1')
  return params.toString()
}
