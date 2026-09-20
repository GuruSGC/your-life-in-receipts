import type { Theme } from '@/constants'

export type ReceiptKind = 'listen' | 'ledger' | 'card'

export interface Receipt {
  id: string
  kind: ReceiptKind
  /** Minutes since 1970-01-01 as recorded (wall clock). Null when the source had no usable date. */
  min: number | null
  title: string
  detail: string
  theme: Theme
  /** Money amount in INR for spend receipts. */
  amount?: number
  direction?: 'out' | 'in' | 'transfer'
  /** Lower-case words used by search and by the link finder. */
  search: string
  artists?: string[]
  place?: string
  flagged?: boolean
  listenMinutes?: number
  plays?: number
  skips?: number
  nightPlays?: number
}

export interface MusicAggregates {
  artists: string[]
  hours: number[]
  hoursByYear: Record<string, number[]>
  playsByYear: Record<string, number>
  skipsByYear: Record<string, number>
  minutesByMonth: Record<string, number>
  topArtists: { name: string; plays: number }[]
  artistYear: { name: string; year: number; plays: number }[]
  newArtistsByYear: Record<string, number>
  comfort: { track: string; artist: string; plays: number; years: number[] }[]
}

export interface SourceQuality {
  label: string
  rows: number
  kept: number
  notes: string[]
}

/** The receipts arrive after the first paint, in pieces, so `complete` says whether they are all here yet. */
export interface LifeData {
  complete: boolean
  receipts: Receipt[]
  byDay: Map<number, Receipt[]>
  music: MusicAggregates
  quality: SourceQuality[]
  totals: {
    plays: number
    listenedMinutes: number
    sessions: number
    spendReceipts: number
    ledgerReceipts: number
    cardReceipts: number
    undated: number
    artists: number
  }
  range: { startMin: number; endMin: number }
  coverage: {
    ledger: { startMin: number; endMin: number }
    card: { startMin: number; endMin: number }
  }
}
