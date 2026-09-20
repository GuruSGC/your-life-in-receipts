import type { LifeData } from '@/features/data'
import { dayOf, monthKey, monthsBetween, monthStartMin } from '@/utils/time'
import type { DayFacts, MonthRow } from './types'

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

export function monthlySeries(life: LifeData): MonthRow[] {
  const rows = new Map<string, MonthRow>()
  for (const key of monthsBetween(monthKey(life.range.startMin), monthKey(life.range.endMin))) {
    rows.set(key, emptyMonth(key))
  }
  for (const receipt of life.receipts) {
    if (receipt.min === null) continue
    const row = rows.get(monthKey(receipt.min))
    if (!row) continue
    if (receipt.kind === 'listen') {
      row.minutes += receipt.listenMinutes ?? 0
      row.plays += receipt.plays ?? 0
      row.sessions += 1
      row.nightPlays += receipt.nightPlays ?? 0
      row.skips += receipt.skips ?? 0
      continue
    }
    if (receipt.kind === 'ledger') row.ledgerCount += 1
    else row.cardCount += 1
    if (receipt.direction === 'out') row.spendOut += receipt.amount ?? 0
    else if (receipt.direction === 'in') row.spendIn += receipt.amount ?? 0
  }
  return [...rows.values()]
}

export function dayFacts(life: LifeData): Map<number, DayFacts> {
  const facts = new Map<number, DayFacts>()
  for (const receipt of life.receipts) {
    if (receipt.min === null) continue
    const day = dayOf(receipt.min)
    let fact = facts.get(day)
    if (!fact) {
      fact = {
        day,
        listenMinutes: 0,
        plays: 0,
        nightPlays: 0,
        artists: new Set(),
        spend: 0,
        themes: new Set(),
        kinds: new Set(),
        receipts: 0,
      }
      facts.set(day, fact)
    }
    fact.receipts += 1
    fact.kinds.add(receipt.kind)
    if (receipt.kind === 'listen') {
      fact.listenMinutes += receipt.listenMinutes ?? 0
      fact.plays += receipt.plays ?? 0
      fact.nightPlays += receipt.nightPlays ?? 0
      for (const artist of receipt.artists ?? []) fact.artists.add(artist)
    } else {
      if (receipt.direction === 'out') fact.spend += receipt.amount ?? 0
      fact.themes.add(receipt.theme)
    }
  }
  return facts
}
