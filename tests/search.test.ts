import { describe, expect, it } from 'vitest'
import type { Receipt } from '@/features/data'
import {
  DEFAULT_FILTERS,
  filterReceipts,
  matchesQuery,
  summarise,
} from '@/features/explore/utils/search'

const make = (over: Partial<Receipt>): Receipt => ({
  id: 'x',
  kind: 'ledger',
  min: Date.UTC(2017, 5, 1) / 60000,
  title: 'Lunch',
  detail: 'Food',
  theme: 'food',
  amount: 100,
  direction: 'out',
  tags: ['lunch', 'food'],
  ...over,
})

const sample: Receipt[] = [
  make({ id: 'a', title: 'Home food delivery', amount: 650 }),
  make({
    id: 'b',
    kind: 'listen',
    title: 'The Beatles',
    detail: '45 plays',
    theme: 'music',
    tags: ['beatles'],
    amount: undefined,
    direction: undefined,
    listenMinutes: 120,
    plays: 45,
    min: Date.UTC(2018, 0, 1) / 60000,
  }),
  make({ id: 'c', kind: 'card', title: 'Kamdar Inc', theme: 'travel', min: null, amount: 9000 }),
  make({ id: 'd', title: 'Milk', amount: 36, min: Date.UTC(2015, 2, 1) / 60000 }),
]

describe('receipt search', () => {
  it('requires every term to match, ignoring case', () => {
    expect(matchesQuery(sample[0] as Receipt, 'HOME delivery')).toBe(true)
    expect(matchesQuery(sample[0] as Receipt, 'home beatles')).toBe(false)
    expect(matchesQuery(sample[0] as Receipt, '   ')).toBe(true)
  })

  it('filters by kind, theme, years and the undated drawer', () => {
    expect(
      filterReceipts(sample, { ...DEFAULT_FILTERS, kinds: ['listen'] }).map((r) => r.id),
    ).toEqual(['b'])
    expect(
      filterReceipts(sample, { ...DEFAULT_FILTERS, theme: 'travel' }).map((r) => r.id),
    ).toEqual(['c'])
    expect(
      filterReceipts(sample, { ...DEFAULT_FILTERS, yearFrom: 2016, yearTo: 2017 })
        .map((r) => r.id)
        .sort(),
    ).toEqual(['a', 'c'])
    expect(
      filterReceipts(sample, { ...DEFAULT_FILTERS, includeUndated: false }).some(
        (r) => r.id === 'c',
      ),
    ).toBe(false)
  })

  it('sorts newest first with undated receipts last, and by amount or listening time', () => {
    expect(filterReceipts(sample, DEFAULT_FILTERS).map((r) => r.id)).toEqual(['b', 'a', 'd', 'c'])
    expect(filterReceipts(sample, { ...DEFAULT_FILTERS, sort: 'oldest' }).map((r) => r.id)).toEqual(
      ['d', 'a', 'b', 'c'],
    )
    expect(filterReceipts(sample, { ...DEFAULT_FILTERS, sort: 'largest' })[0]?.id).toBe('c')
    expect(filterReceipts(sample, { ...DEFAULT_FILTERS, sort: 'longest' })[0]?.id).toBe('b')
  })

  it('summarises matches', () => {
    expect(summarise(sample)).toEqual({ count: 4, spend: 9686, minutes: 120 })
    expect(summarise([])).toEqual({ count: 0, spend: 0, minutes: 0 })
  })
})
