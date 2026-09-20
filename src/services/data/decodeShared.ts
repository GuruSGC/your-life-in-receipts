import type { MusicAggregates, Receipt, SourceQuality } from '@/types'

/** Small readers shared by the three decoders. */
export const num = (value: unknown, what: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Data file has a non-number in ${what}`)
  return value
}
export const str = (value: unknown): string => (typeof value === 'string' ? value : '')
export const at = (list: string[], index: unknown): string =>
  typeof index === 'number' && index >= 0 ? (list[index] ?? '') : ''
export const words = (...parts: string[]): string =>
  [
    ...new Set(
      parts
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9₹]+/)
        .filter((word) => word.length > 1),
    ),
  ].join(' ')

export interface Decoded {
  receipts: Receipt[]
  music?: MusicAggregates
  quality: SourceQuality
  startMin: number
  endMin: number
  extra: Record<string, number>
}
