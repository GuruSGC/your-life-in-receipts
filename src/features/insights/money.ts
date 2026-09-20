import type { LifeData, Receipt } from '@/features/data'
import { THEME_LABELS, type Theme } from '@/constants'
import { formatNumber, formatPercent, formatRupees } from '@/utils/format'
import { dayOf, formatDay, hourOf } from '@/utils/time'
import { pearson, sum } from './stats'
import type { DayFacts, Insight, Link, MonthRow } from './types'

const ledgerOut = (life: LifeData): Receipt[] =>
  life.receipts.filter((receipt) => receipt.kind === 'ledger' && receipt.direction === 'out')
const cardDated = (life: LifeData): Receipt[] =>
  life.receipts.filter((receipt) => receipt.kind === 'card' && receipt.min !== null)

const topOf = (totals: Map<Theme, number>): [Theme, number] | undefined =>
  [...totals].filter(([key]) => key !== 'other').sort((a, b) => b[1] - a[1])[0]

function tallyThemes(rows: Receipt[]): { amounts: Map<Theme, number>; counts: Map<Theme, number> } {
  const amounts = new Map<Theme, number>()
  const counts = new Map<Theme, number>()
  for (const receipt of rows) {
    amounts.set(receipt.theme, (amounts.get(receipt.theme) ?? 0) + (receipt.amount ?? 0))
    counts.set(receipt.theme, (counts.get(receipt.theme) ?? 0) + 1)
  }
  return { amounts, counts }
}

export function spendingIdentity(life: LifeData): Insight | null {
  const rows = ledgerOut(life)
  const everyday = rows.filter((row) => row.theme !== 'money')
  const { amounts, counts } = tallyThemes(everyday)
  const top = topOf(amounts)
  if (!top) return null
  const [theme, amount] = top
  const overall = sum(everyday.map((row) => row.amount ?? 0))
  const moved = sum(rows.filter((row) => row.theme === 'money').map((row) => row.amount ?? 0))
  const frequent = topOf(counts)
  const themeRows = everyday.filter((row) => row.theme === theme)
  const biggest = themeRows.reduce(
    (best, row) => ((row.amount ?? 0) > (best.amount ?? 0) ? row : best),
    themeRows[0] as Receipt,
  )
  const label = THEME_LABELS[theme].toLowerCase()
  const byCount = frequent ? THEME_LABELS[frequent[0]].toLowerCase() : 'small purchases'
  return {
    id: 'money-identity',
    group: 'money',
    headline: `Everyday money goes to ${label}`,
    body: `${THEME_LABELS[theme]} takes ${formatPercent(amount / overall)} of the ${formatRupees(overall)} spent on everyday life in the household ledger. By count, ${byCount} wins with ${formatNumber(frequent?.[1] ?? 0)} entries. A further ${formatRupees(moved)} moved through savings, investments and transfers and is not counted as spending.`,
    stat: formatPercent(amount / overall),
    statLabel: `of everyday spending was ${label}`,
    evidenceDays: biggest?.min == null ? [] : [dayOf(biggest.min)],
  }
}

function strengthWord(r: number): string {
  if (Math.abs(r) < 0.2) return 'barely'
  return Math.abs(r) < 0.5 ? 'loosely' : 'closely'
}

function correlationSentence(r: number): string {
  if (r >= 0.2) return 'Busier months for music were also busier months for money.'
  if (r <= -0.2) return 'Months with more music had less spending.'
  return 'The two run mostly independently.'
}

export function listeningAndSpending(
  months: MonthRow[],
  facts: Map<number, DayFacts>,
): Insight | null {
  const both = months.filter((row) => row.plays > 0 && row.ledgerCount > 20)
  if (both.length < 12) return null
  const r = pearson(
    both.map((row) => row.minutes),
    both.map((row) => row.spendOut),
  )
  const strength = strengthWord(r)
  const days = [...facts.values()]
    .filter((fact) => fact.kinds.has('listen') && fact.kinds.has('ledger'))
    .sort((a, b) => b.listenMinutes + b.spend / 50 - (a.listenMinutes + a.spend / 50))
    .slice(0, 8)
    .map((fact) => fact.day)
  return {
    id: 'music-money',
    group: 'link',
    headline: `Listening and spending ${r >= 0 ? 'move' : 'pull'} ${strength} together`,
    body: `Across ${both.length} months where both the ledger and the music exist, monthly listening minutes and monthly spending have a correlation of ${r.toFixed(2)}. ${correlationSentence(r)} It shows co-movement, not cause.`,
    stat: r.toFixed(2),
    statLabel: 'monthly correlation (−1 to 1)',
    evidenceDays: days,
  }
}

export function strongestLink(links: Link[]): Insight | null {
  const link = links.find((item) => item.lift > 1) ?? links[0]
  if (!link) return null
  const theme = THEME_LABELS[link.theme].toLowerCase()
  return {
    id: 'top-link',
    group: 'link',
    headline: `${link.artist} shows up on ${theme} days`,
    body: `On the ${formatNumber(link.themeDays)} days with ${theme} spending, ${link.artist} played on ${formatPercent(link.conditionalRate)} of them, against ${formatPercent(link.baseRate)} of all days in the same period: ${link.lift.toFixed(1)} times the usual rate across ${link.bothDays} shared days.`,
    stat: `${link.lift.toFixed(1)}×`,
    statLabel: `${link.artist} on ${theme} days`,
    evidenceDays: link.sampleDays,
  }
}

export function cardPlaces(life: LifeData): Insight | null {
  const rows = cardDated(life)
  const placed = rows.filter((row) => row.place?.includes(', '))
  if (placed.length < 50) return null
  const cities = new Map<string, number>()
  for (const row of placed) cities.set(row.place ?? '', (cities.get(row.place ?? '') ?? 0) + 1)
  const states = new Set(placed.map((row) => row.place?.split(', ')[1] ?? ''))
  const [topPlace = '', topCount = 0] = [...cities].sort((a, b) => b[1] - a[1])[0] ?? []
  const late = rows.filter((row) => hourOf(row.min ?? 0) >= 22 || hourOf(row.min ?? 0) < 4)
  const lateDays = late.slice(0, 8).map((row) => dayOf(row.min ?? 0))
  return {
    id: 'card-places',
    group: 'money',
    headline: `${formatNumber(cities.size)} places on one card`,
    body: `The card statement names ${formatNumber(cities.size)} different cities in ${formatNumber(states.size)} states, but no place shows up more than ${topCount} times (${topPlace}). ${formatPercent(late.length / rows.length)} of card receipts were stamped between 22:00 and 04:00.`,
    stat: formatNumber(cities.size),
    statLabel: 'cities on the card statement',
    evidenceDays: lateDays,
  }
}

export function dataHonesty(life: LifeData): Insight {
  const card = life.quality[2]
  const drawer = life.receipts.filter((receipt) => receipt.min === null).length
  return {
    id: 'data-honesty',
    group: 'data',
    headline: 'Not every receipt is clean',
    body: `${card ? `${formatNumber(card.rows)} card rows held ${formatNumber(life.receipts.filter((r) => r.kind === 'card').length)} usable receipts.` : ''} Repeated copies were merged, and ${formatNumber(drawer)} receipts with no date sit in “The drawer”. Nothing was guessed: what is missing stays missing.`,
    stat: formatNumber(drawer),
    statLabel: 'receipts with no date',
    evidenceDays: [],
  }
}

export function firstMoment(life: LifeData): string {
  const first = life.receipts.find((receipt) => receipt.min !== null)
  return first?.min === null || !first ? '' : formatDay(dayOf(first.min ?? 0))
}
