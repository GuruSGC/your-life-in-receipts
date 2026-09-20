import type { LifeData } from '@/types'
import { formatDuration, formatNumber } from './format'
import { dayOf, formatDay } from './time'

/** The rows of the one-life receipt, as label and value pairs. Shown on the page and drawn into the saved image. */
export function totalsLines(life: LifeData): [string, string][] {
  return [
    ['First receipt', formatDay(dayOf(life.range.startMin))],
    ['Last receipt', formatDay(dayOf(life.range.endMin))],
    ['Songs played', formatNumber(life.totals.plays)],
    ['Time listening', formatDuration(life.totals.listenedMinutes)],
    ['Different artists', formatNumber(life.totals.artists)],
    ['Listening sessions', formatNumber(life.totals.sessions)],
    ['Household entries', formatNumber(life.totals.ledgerReceipts)],
    ['Card receipts', formatNumber(life.totals.cardReceipts)],
    ['In the drawer, no date', formatNumber(life.totals.undated)],
  ]
}

/** The closing line of the receipt: how many receipts there are in all. */
export const receiptTotal = (life: LifeData): string =>
  formatNumber(life.totals.sessions + life.totals.spendReceipts)
