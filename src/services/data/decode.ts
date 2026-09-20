import { MINUTES_PER_DAY } from '@/constants'
import type { LifeData, Receipt } from '@/types'
import type { Decoded } from './decodeShared'

export { decodeMusic } from './decodeMusic'
export { decodeCard, decodeLedger, ledgerTheme } from './decodeMoney'
export type { Decoded } from './decodeShared'

/** Groups receipts by the day they were recorded on. */
export function indexByDay(receipts: Receipt[]): Map<number, Receipt[]> {
  const byDay = new Map<number, Receipt[]>()
  for (const receipt of receipts) {
    if (receipt.min === null) continue
    const day = Math.floor(receipt.min / MINUTES_PER_DAY)
    const list = byDay.get(day)
    if (list) list.push(receipt)
    else byDay.set(day, [receipt])
  }
  return byDay
}

/** The same life without its receipts, for the first paint. */
export function withoutReceipts(life: LifeData): LifeData {
  return { ...life, complete: false, receipts: [], byDay: new Map() }
}

/** Fills in the receipts once they have all arrived. */
export function withReceipts(life: LifeData, receipts: Receipt[]): LifeData {
  return { ...life, complete: true, receipts, byDay: indexByDay(receipts) }
}

/** Joins the three decoded sources into one life, with totals, coverage and a day index. */
export function assemble(music: Decoded, ledger: Decoded, card: Decoded): LifeData {
  if (!music.music) throw new Error('Music aggregates are missing')
  const receipts = [...music.receipts, ...ledger.receipts, ...card.receipts].sort(
    (a, b) => (a.min ?? Number.MAX_SAFE_INTEGER) - (b.min ?? Number.MAX_SAFE_INTEGER),
  )
  return {
    complete: true,
    receipts,
    byDay: indexByDay(receipts),
    music: music.music,
    quality: [music.quality, ledger.quality, card.quality],
    totals: {
      plays: music.extra.plays ?? 0,
      listenedMinutes: music.extra.listenedMinutes ?? 0,
      sessions: music.receipts.length,
      spendReceipts: ledger.receipts.length + card.receipts.length,
      ledgerReceipts: ledger.receipts.length,
      cardReceipts: card.receipts.length,
      undated: receipts.filter((receipt) => receipt.min === null).length,
      artists: music.extra.artists ?? 0,
    },
    range: {
      startMin: Math.min(music.startMin, ledger.startMin, card.startMin),
      endMin: Math.max(music.endMin, ledger.endMin, card.endMin),
    },
    coverage: {
      ledger: { startMin: ledger.startMin, endMin: ledger.endMin },
      card: { startMin: card.startMin, endMin: card.endMin },
    },
  }
}
