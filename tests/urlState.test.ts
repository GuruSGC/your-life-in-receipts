import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS } from '@/features/explore/utils/search'
import { filtersFromParams, paramsFromFilters } from '@/features/explore/utils/urlState'

describe('shareable search links', () => {
  it('round-trips the search text, the theme and the scrapbook filter', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      query: 'the beatles',
      theme: 'food' as const,
      pinnedOnly: true,
    }
    const text = paramsFromFilters(filters)
    expect(text).toBe('q=the+beatles&theme=food&pinned=1')
    expect(filtersFromParams(new URLSearchParams(text))).toMatchObject({
      query: 'the beatles',
      theme: 'food',
      pinnedOnly: true,
    })
  })

  it('writes nothing for the defaults and ignores invalid or oversized values', () => {
    expect(paramsFromFilters(DEFAULT_FILTERS)).toBe('')
    expect(filtersFromParams(new URLSearchParams('theme=nonsense&pinned=yes')).theme).toBe('all')
    expect(filtersFromParams(new URLSearchParams(`q=${'a'.repeat(200)}`)).query).toHaveLength(80)
  })
})
