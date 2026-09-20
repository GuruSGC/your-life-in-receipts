import type { LifeData } from '@/features/data'
import { THEME_LABELS, type Theme } from '@/shared/constants'
import { formatNumber, formatPercent } from '@/shared/utils/format'
import { dayOf, formatMonth, monthKey, monthStartMin, nextMonthKey } from '@/shared/utils/time'
import { median, sse } from './stats'
import type { Chapter, DayFacts, MonthRow, Source } from './types'

const MIN_MONTHS = 6
const TARGET_CHAPTERS = 7
const NEXT_MONTH_OFFSET_MIN = 45_000

interface Segment {
  from: number
  to: number
}

interface Split {
  index: number
  at: number
  gain: number
}

/** Forced cut points where a data source starts or stops, as month indexes into the series. */
function sourceCuts(life: LifeData, months: MonthRow[]): number[] {
  const indexOf = (min: number): number => months.findIndex((row) => row.key === monthKey(min))
  const cuts = new Set<number>()
  for (const { startMin, endMin } of [life.coverage.ledger, life.coverage.card]) {
    const start = indexOf(startMin)
    const end = indexOf(endMin) + 1
    if (start > 0) cuts.add(start)
    if (end > 0 && end < months.length) cuts.add(end)
  }
  return [...cuts].sort((a, b) => a - b)
}

function bestSplit(levels: number[], segment: Segment): { at: number; gain: number } | null {
  if (segment.to - segment.from < MIN_MONTHS * 2) return null
  const whole = sse(levels, segment.from, segment.to)
  let best: { at: number; gain: number } | null = null
  for (let at = segment.from + MIN_MONTHS; at <= segment.to - MIN_MONTHS; at += 1) {
    const gain = whole - sse(levels, segment.from, at) - sse(levels, at, segment.to)
    if (!best || gain > best.gain) best = { at, gain }
  }
  return best
}

/** Binary segmentation of log listening minutes, starting from the forced source boundaries. */
export function segmentMonths(
  levels: number[],
  forcedCuts: number[],
  target = TARGET_CHAPTERS,
): Segment[] {
  const edges = [0, ...forcedCuts, levels.length]
  let segments: Segment[] = []
  for (let i = 0; i < edges.length - 1; i += 1)
    segments.push({ from: edges[i] ?? 0, to: edges[i + 1] ?? levels.length })
  while (segments.length < target) {
    let pick: Split | null = null
    segments.forEach((segment, index) => {
      const split = bestSplit(levels, segment)
      if (split && (!pick || split.gain > pick.gain)) pick = { index, ...split }
    })
    const chosen = pick as Split | null
    const victim = chosen ? segments[chosen.index] : undefined
    if (!chosen || !victim) break
    segments = [
      ...segments.slice(0, chosen.index),
      { from: victim.from, to: chosen.at },
      { from: chosen.at, to: victim.to },
      ...segments.slice(chosen.index + 1),
    ]
  }
  return segments
}

interface Traits {
  level: number
  nightShare: number
  skipRate: number
  leadShare: number
  avgSession: number
  newLeadRate: number
}

interface Measured extends Traits {
  lead: string
  plays: number
  sessions: number
  minutes: number
}

const relative = (value: number, base: number): number => (base ? value / base - 1 : 0)

/**
 * Names a chapter after the trait that sets it furthest apart from the whole timeline.
 * `avoid` keeps neighbouring chapters from sharing a name.
 */
export function pickPersona(t: Traits, base: Traits, lead: string, avoid = ''): string {
  const candidates: [string, number][] = [
    ['The Quiet Stretch', (0.5 - t.level) / 0.2],
    ['The Explorer', relative(t.newLeadRate, base.newLeadRate) / 0.5],
    [`The ${lead.replace(/^The /, '')} Loyalist`, (t.leadShare - base.leadShare) / 0.05],
    ['The Night Shift', (t.nightShare - base.nightShare) / 0.04],
    ['The Soundtrack Years', (t.level - 1) / 0.5],
    ['The Restless Thumb', relative(t.skipRate, base.skipRate) / 0.5],
    ['The Long Listen', relative(t.avgSession, base.avgSession) / 0.3],
  ]
  const ranked = candidates
    .filter(([name, score]) => score >= 0.5 && name !== avoid)
    .sort((a, b) => b[1] - a[1])
  return ranked[0]?.[0] ?? 'The Steady Rhythm'
}

function tallyLeads(
  life: LifeData,
  first: number,
  last: number,
  seen: Set<string>,
): { lead: string; leadPlays: number; newLeads: number } {
  const leads = new Map<string, number>()
  let newLeads = 0
  for (const receipt of life.receipts) {
    if (receipt.kind !== 'listen' || receipt.min === null) continue
    if (receipt.min < first || receipt.min >= last) continue
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
  const totals = new Map<Theme, number>()
  let spend = 0
  for (const receipt of life.receipts) {
    if (
      receipt.kind === 'listen' ||
      receipt.min === null ||
      receipt.min < startMin ||
      receipt.min >= endMin
    )
      continue
    if (receipt.direction !== 'out' || receipt.theme === 'money') continue
    totals.set(receipt.theme, (totals.get(receipt.theme) ?? 0) + (receipt.amount ?? 0))
    spend += receipt.amount ?? 0
  }
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
