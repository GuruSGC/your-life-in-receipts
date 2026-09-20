import type { Theme } from '@/shared/constants'

export interface MonthRow {
  key: string
  startMin: number
  minutes: number
  plays: number
  sessions: number
  nightPlays: number
  skips: number
  spendOut: number
  spendIn: number
  ledgerCount: number
  cardCount: number
}

export interface DayFacts {
  day: number
  listenMinutes: number
  plays: number
  nightPlays: number
  artists: Set<string>
  spend: number
  themes: Set<Theme>
  kinds: Set<string>
  receipts: number
}

export type Source = 'music' | 'ledger' | 'card'

export interface Chapter {
  id: string
  index: number
  startKey: string
  endKey: string
  startMin: number
  endMin: number
  persona: string
  title: string
  blurb: string
  sources: Source[]
  stats: {
    plays: number
    minutes: number
    sessions: number
    nightShare: number
    skipRate: number
    leadArtist: string
    leadShare: number
    spend: number
    topTheme: Theme | null
    topThemeShare: number
  }
  momentDay: number | null
}

export interface Insight {
  id: string
  group: 'rhythm' | 'habit' | 'era' | 'link' | 'money' | 'data'
  headline: string
  body: string
  stat: string
  statLabel: string
  evidenceDays: number[]
}

export interface Link {
  artist: string
  theme: Theme
  window: 'diary' | 'card'
  lift: number
  bothDays: number
  themeDays: number
  baseRate: number
  conditionalRate: number
  sampleDays: number[]
}
