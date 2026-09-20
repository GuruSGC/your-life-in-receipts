import type { Receipt, ReceiptKind } from '@/features/data'

export interface Step {
  kind: ReceiptKind
  count: number
  /** Minutes of music for a listening step, rupees spent for a spending step. */
  amount: number
  /** The first receipt's title, as a hint of what it was. */
  lead: string
}

function sizeOf(receipt: Receipt): number {
  if (receipt.kind === 'listen') return receipt.listenMinutes ?? 0
  return receipt.direction === 'out' ? (receipt.amount ?? 0) : 0
}

/**
 * Reads a day as a chain: consecutive receipts of the same kind become one step, so a day of music, then a
 * purchase, then more music reads as Music, Spending, Music.
 */
export function chainOf(receipts: Receipt[]): Step[] {
  const ordered = [...receipts].sort((a, b) => (a.min ?? 0) - (b.min ?? 0))
  const chain: Step[] = []
  for (const receipt of ordered) {
    const last = chain.at(-1)
    if (last?.kind === receipt.kind) {
      last.count += 1
      last.amount += sizeOf(receipt)
    } else
      chain.push({ kind: receipt.kind, count: 1, amount: sizeOf(receipt), lead: receipt.title })
  }
  return chain
}
