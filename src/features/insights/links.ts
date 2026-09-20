import type { LifeData } from '@/features/data'
import type { Theme } from '@/constants'
import { dayOf } from '@/utils/time'
import type { DayFacts, Link } from './types'

const MIN_BOTH_DAYS = 8
const MIN_THEME_DAYS = 20
const TOP_ARTISTS = 15
const KEEP = 24
const SAMPLE_DAYS = 6

interface Window {
  key: Link['window']
  startDay: number
  endDay: number
}

interface DayIndex {
  themeDays: Map<Theme, number[]>
  artistDays: Map<string, Set<number>>
}

/** Which days each theme showed up in the ledger and which days each artist was played. */
function indexDays(window: Window, facts: Map<number, DayFacts>, artists: string[]): DayIndex {
  const themeDays = new Map<Theme, number[]>()
  const artistDays = new Map<string, Set<number>>()
  for (let day = window.startDay; day <= window.endDay; day += 1) {
    const fact = facts.get(day)
    if (!fact) continue
    for (const theme of fact.themes) {
      if (theme === 'other' || theme === 'music') continue
      themeDays.set(theme, [...(themeDays.get(theme) ?? []), day])
    }
    for (const artist of fact.artists.values()) {
      if (!artists.includes(artist)) continue
      artistDays.set(artist, (artistDays.get(artist) ?? new Set<number>()).add(day))
    }
  }
  return { themeDays, artistDays }
}

interface Pair {
  window: Window
  total: number
  theme: Theme
  days: number[]
  artist: string
  played: Set<number>
}

function scorePair({ window, total, theme, days, artist, played }: Pair): Link | null {
  const both = days.filter((day) => played.has(day))
  const baseRate = played.size / total
  if (both.length < MIN_BOTH_DAYS || baseRate === 0) return null
  const conditionalRate = both.length / days.length
  const lift = conditionalRate / baseRate
  if (lift < 1.25 && lift > 0.75) return null
  return {
    artist,
    theme,
    window: window.key,
    lift,
    bothDays: both.length,
    themeDays: days.length,
    baseRate,
    conditionalRate,
    sampleDays: both.slice(0, SAMPLE_DAYS),
  }
}

/** Links between the ledger's themes and the artists played on the same days, within one window. */
function linksIn(window: Window, facts: Map<number, DayFacts>, artists: string[]): Link[] {
  const total = window.endDay - window.startDay + 1
  const { themeDays, artistDays } = indexDays(window, facts, artists)
  const links: Link[] = []
  for (const [theme, days] of themeDays) {
    if (days.length < MIN_THEME_DAYS) continue
    for (const [artist, played] of artistDays) {
      const link = scorePair({ window, total, theme, days, artist, played })
      if (link) links.push(link)
    }
  }
  return links
}

const strength = (link: Link): number => Math.abs(Math.log(link.lift)) * Math.sqrt(link.bothDays)

export function findLinks(life: LifeData, facts: Map<number, DayFacts>): Link[] {
  const artists = life.music.topArtists.slice(0, TOP_ARTISTS).map((artist) => artist.name)
  const windows: Window[] = [
    {
      key: 'diary',
      startDay: dayOf(life.coverage.ledger.startMin),
      endDay: dayOf(life.coverage.ledger.endMin),
    },
    {
      key: 'card',
      startDay: dayOf(life.coverage.card.startMin),
      endDay: dayOf(life.coverage.card.endMin),
    },
  ]
  return windows
    .flatMap((window) => linksIn(window, facts, artists))
    .sort((a, b) => strength(b) - strength(a))
    .slice(0, KEEP)
}
