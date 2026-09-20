import type { LifeData, Receipt } from '@/types'
import { dayOf, monthKey, monthsBetween, monthStartMin } from '@/utils/time'
import type { DayFacts, MonthRow } from '@/types'

const emptyMonth = (key: string): MonthRow => ({
  key,
  startMin: monthStartMin(key),
  minutes: 0,
  plays: 0,
  sessions: 0,
  nightPlays: 0,
  skips: 0,
  spendOut: 0,
  spendIn: 0,
  ledgerCount: 0,
  cardCount: 0,
})

const emptyDay = (day: number): DayFacts => ({
  day,
  listenMinutes: 0,
  plays: 0,
  nightPlays: 0,
  artists: new Set(),
  spend: 0,
  themes: new Set(),
  kinds: new Set(),
  receipts: 0,
})

function addListen(row: MonthRow, receipt: Receipt): void {
  row.minutes += receipt.listenMinutes ?? 0
  row.plays += receipt.plays ?? 0
  row.sessions += 1
  row.nightPlays += receipt.nightPlays ?? 0
  row.skips += receipt.skips ?? 0
}

function addSpend(row: MonthRow, receipt: Receipt): void {
  if (receipt.kind === 'ledger') row.ledgerCount += 1
  else row.cardCount += 1
  if (receipt.direction === 'out') row.spendOut += receipt.amount ?? 0
  else if (receipt.direction === 'in') row.spendIn += receipt.amount ?? 0
}

/** One row per calendar month from the first receipt to the last, with listening and spending totals. */
export function monthlySeries(life: LifeData): MonthRow[] {
  const rows = new Map<string, MonthRow>()
  for (const key of monthsBetween(monthKey(life.range.startMin), monthKey(life.range.endMin))) {
    rows.set(key, emptyMonth(key))
  }
  for (const receipt of life.receipts) {
    const row = receipt.min === null ? undefined : rows.get(monthKey(receipt.min))
    if (!row) continue
    if (receipt.kind === 'listen') addListen(row, receipt)
    else addSpend(row, receipt)
  }
  return [...rows.values()]
}

function addToDay(fact: DayFacts, receipt: Receipt): void {
  fact.receipts += 1
  fact.kinds.add(receipt.kind)
  if (receipt.kind === 'listen') {
    fact.listenMinutes += receipt.listenMinutes ?? 0
    fact.plays += receipt.plays ?? 0
    fact.nightPlays += receipt.nightPlays ?? 0
    for (const artist of receipt.artists ?? []) fact.artists.add(artist)
    return
  }
  if (receipt.direction === 'out') fact.spend += receipt.amount ?? 0
  fact.themes.add(receipt.theme)
}

/** What happened on each day that has any receipt, keyed by day number. */
export function dayFacts(life: LifeData): Map<number, DayFacts> {
  const facts = new Map<number, DayFacts>()
  for (const receipt of life.receipts) {
    if (receipt.min === null) continue
    const day = dayOf(receipt.min)
    const fact = facts.get(day) ?? emptyDay(day)
    facts.set(day, fact)
    addToDay(fact, receipt)
  }
  return facts
}
