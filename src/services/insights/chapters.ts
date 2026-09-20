import type { LifeData } from '@/types'
import { THEME_LABELS, type Theme } from '@/constants'
import { formatNumber, formatPercent } from '@/utils/format'
import { dayOf, formatMonth, monthStartMin, nextMonthKey } from '@/utils/time'
import { median } from './stats'
import { pickPersona, type Traits } from './persona'
import { segmentMonths, sourceCuts } from './segments'
import type { Chapter, DayFacts, MonthRow, Source } from '@/types'

const NEXT_MONTH_OFFSET_MIN = 45_000

export { pickPersona } from './persona'
export { segmentMonths } from './segments'

interface Measured extends Traits {
  lead: string
  plays: number
  sessions: number
  minutes: number
}

const within = (min: number | null, first: number, last: number): boolean =>
  min !== null && min >= first && min < last

function tallyLeads(
  life: LifeData,
  first: number,
  last: number,
  seen: Set<string>,
): { lead: string; leadPlays: number; newLeads: number } {
  const leads = new Map<string, number>()
  const listens = life.receipts.filter((r) => r.kind === 'listen' && within(r.min, first, last))
  let newLeads = 0
  for (const receipt of listens) {
    const lead = receipt.artists?.[0]
    if (!lead) continue
    leads.set(lead, (leads.get(lead) ?? 0) + (receipt.plays ?? 1))
    if (!seen.has(lead)) {
      newLeads += 1
      seen.add(lead)
    }
  }
  const [lead = 'Unknown', leadPlays = 0] = [...leads].sort((a, b) => b[1] - a[1])[0] ?? []
  return { lead, leadPlays, newLeads }
}

const total = (rows: MonthRow[], pick: (row: MonthRow) => number): number =>
  rows.reduce((sum, row) => sum + pick(row), 0)

function measure(
  rows: MonthRow[],
  life: LifeData,
  medianMinutes: number,
  seen: Set<string>,
): Measured {
  const first = rows[0]?.startMin ?? 0
  const last = (rows.at(-1)?.startMin ?? 0) + NEXT_MONTH_OFFSET_MIN
  const plays = total(rows, (row) => row.plays)
  const sessions = total(rows, (row) => row.sessions)
  const minutes = total(rows, (row) => row.minutes)
  const { lead, leadPlays, newLeads } = tallyLeads(life, first, last, seen)
  const per = (value: number, divisor: number): number => (divisor ? value / divisor : 0)
  return {
    lead,
    plays,
    sessions,
    minutes,
    level: rows.length ? per(minutes / rows.length, medianMinutes) : 0,
    nightShare: per(
      total(rows, (row) => row.nightPlays),
      plays,
    ),
    skipRate: per(
      total(rows, (row) => row.skips),
      plays,
    ),
    leadShare: per(leadPlays, plays),
    avgSession: per(minutes, sessions),
    newLeadRate: per(newLeads, sessions),
  }
}

function spendTheme(
  life: LifeData,
  startMin: number,
  endMin: number,
): { theme: Theme | null; share: number; spend: number } {
  const spent = life.receipts.filter(
    (r) =>
      r.kind !== 'listen' &&
      within(r.min, startMin, endMin) &&
      r.direction === 'out' &&
      r.theme !== 'money',
  )
  const totals = new Map<Theme, number>()
  for (const receipt of spent) {
    totals.set(receipt.theme, (totals.get(receipt.theme) ?? 0) + (receipt.amount ?? 0))
  }
  const spend = spent.reduce((sum, receipt) => sum + (receipt.amount ?? 0), 0)
  const top = [...totals].filter(([theme]) => theme !== 'other').sort((a, b) => b[1] - a[1])[0]
  return { theme: top?.[0] ?? null, share: top && spend ? top[1] / spend : 0, spend }
}

function richestDay(facts: Map<number, DayFacts>, startMin: number, endMin: number): number | null {
  let best: number | null = null
  let bestScore = 0
  for (let day = dayOf(startMin); day < dayOf(endMin); day += 1) {
    const fact = facts.get(day)
    if (!fact || fact.kinds.size < 2) continue
    const score =
      fact.kinds.size * 1000 +
      Math.min(fact.receipts, 40) * 10 +
      Math.min(fact.listenMinutes, 300) / 30
    if (score > bestScore) {
      best = day
      bestScore = score
    }
  }
  return best
}

function blurbOf(traits: Measured, money: ReturnType<typeof spendTheme>): string {
  if (traits.plays === 0) return 'No listening was recorded in these months.'
  const parts = [
    `${formatNumber(traits.plays)} plays`,
    `${formatPercent(traits.nightShare)} between 22:00 and 04:00`,
    `${formatPercent(traits.skipRate)} skipped ahead`,
    `${traits.lead} led ${formatPercent(traits.leadShare)}`,
    money.theme
      ? `${THEME_LABELS[money.theme]} was ${formatPercent(money.share)} of spending`
      : null,
  ].filter((part): part is string => part !== null)
  return `${parts.join('. ')}.`
}

/** Splits the timeline into chapters and names each after what sets it apart. */
export function buildChapters(
  life: LifeData,
  months: MonthRow[],
  facts: Map<number, DayFacts>,
): Chapter[] {
  const levels = months.map((row) => Math.log1p(row.minutes))
  const segments = segmentMonths(levels, sourceCuts(life, months))
  const medianMinutes = median(months.filter((row) => row.minutes > 0).map((row) => row.minutes))
  const whole = measure(months, life, medianMinutes, new Set())
  const seen = new Set<string>()
  let previous = ''
  return segments.map((segment, index) => {
    const rows = months.slice(segment.from, segment.to)
    const startKey = rows[0]?.key ?? months[0]?.key ?? ''
    const endKey = rows.at(-1)?.key ?? startKey
    const startMin = monthStartMin(startKey)
    const endMin = monthStartMin(nextMonthKey(endKey))
    const traits = measure(rows, life, medianMinutes, seen)
    const money = spendTheme(life, startMin, endMin)
    const sources: Source[] = ['music']
    if (rows.some((row) => row.ledgerCount > 0)) sources.push('ledger')
    if (rows.some((row) => row.cardCount > 0)) sources.push('card')
    const persona =
      traits.plays === 0 ? 'The Silence' : pickPersona(traits, whole, traits.lead, previous)
    previous = persona
    return {
      id: `chapter-${index + 1}`,
      index: index + 1,
      startKey,
      endKey,
      startMin,
      endMin,
      persona,
      title: `${formatMonth(startKey)} to ${formatMonth(endKey)}`,
      blurb: blurbOf(traits, money),
      sources,
      stats: {
        plays: traits.plays,
        minutes: traits.minutes,
        sessions: traits.sessions,
        nightShare: traits.nightShare,
        skipRate: traits.skipRate,
        leadArtist: traits.lead,
        leadShare: traits.leadShare,
        spend: money.spend,
        topTheme: money.theme,
        topThemeShare: money.share,
      },
      momentDay: richestDay(facts, startMin, endMin),
    }
  })
}
