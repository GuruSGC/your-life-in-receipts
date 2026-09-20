import type { Receipt, ReceiptKind } from '@/features/data'
import type { Theme } from '@/constants'
import { yearOf } from '@/utils/time'

export type SortKey = 'newest' | 'oldest' | 'largest' | 'longest'

export interface Filters {
  query: string
  kinds: ReceiptKind[]
  theme: Theme | 'all'
  yearFrom: number | null
  yearTo: number | null
  includeUndated: boolean
  pinnedOnly: boolean
  sort: SortKey
}

/** The filters Explore starts with: everything, newest first. */
export const DEFAULT_FILTERS: Filters = {
  query: '',
  kinds: ['listen', 'ledger', 'card'],
  theme: 'all',
  yearFrom: null,
  yearTo: null,
  includeUndated: true,
  pinnedOnly: false,
  sort: 'newest',
}

const haystack = (receipt: Receipt): string =>
  `${receipt.title} ${receipt.detail} ${receipt.search}`.toLowerCase()

/** Every whitespace-separated term must appear somewhere in the receipt's text. */
export function matchesQuery(receipt: Receipt, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const text = haystack(receipt)
  return terms.every((term) => text.includes(term))
}

function inYears(receipt: Receipt, filters: Filters): boolean {
  if (receipt.min === null) return filters.includeUndated
  const year = yearOf(receipt.min)
  if (filters.yearFrom !== null && year < filters.yearFrom) return false
  return filters.yearTo === null || year <= filters.yearTo
}

const weight = (receipt: Receipt, sort: SortKey): number => {
  if (sort === 'largest') return receipt.amount ?? -1
  if (sort === 'longest') return receipt.listenMinutes ?? -1
  return receipt.min ?? 0
}

/** Receipts with no date always sort after dated ones. */
function undatedOrder(a: Receipt, b: Receipt): number {
  if (a.min === b.min) return 0
  return a.min === null ? 1 : -1
}

/** Applies search, kind, theme and year filters and sorts the result. */
export function filterReceipts(receipts: Receipt[], filters: Filters): Receipt[] {
  const kinds = new Set(filters.kinds)
  const found = receipts.filter(
    (receipt) =>
      kinds.has(receipt.kind) &&
      (filters.theme === 'all' || receipt.theme === filters.theme) &&
      inYears(receipt, filters) &&
      matchesQuery(receipt, filters.query),
  )
  const direction = filters.sort === 'oldest' ? 1 : -1
  const undatedLast = filters.sort === 'newest' || filters.sort === 'oldest'
  return found.sort((a, b) => {
    if (undatedLast && (a.min === null || b.min === null)) return undatedOrder(a, b)
    return direction * (weight(a, filters.sort) - weight(b, filters.sort))
  })
}

/** Counts the receipts, the money spent and the minutes of music in a result set. */
export function summarise(found: Receipt[]): { count: number; spend: number; minutes: number } {
  let spend = 0
  let minutes = 0
  for (const receipt of found) {
    if (receipt.kind === 'listen') minutes += receipt.listenMinutes ?? 0
    else if (receipt.direction === 'out') spend += receipt.amount ?? 0
  }
  return { count: found.length, spend, minutes }
}
