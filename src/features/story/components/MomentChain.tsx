import {
  ArrowRight,
  CreditCard,
  MusicNotes,
  Receipt as ReceiptIcon,
  type Icon,
} from '@phosphor-icons/react'
import type { Receipt, ReceiptKind } from '@/features/data'
import { formatDuration, formatRupees } from '@/utils/format'
import { chainOf } from '../utils/moment'

const ICONS: Record<ReceiptKind, Icon> = {
  listen: MusicNotes,
  ledger: ReceiptIcon,
  card: CreditCard,
}
const NAMES: Record<ReceiptKind, string> = { listen: 'Music', ledger: 'Household', card: 'Card' }

/** A day read left to right: music, then a purchase, then more music, each step with its size. */
export function MomentChain({ receipts }: { receipts: Receipt[] }) {
  const chain = chainOf(receipts)
  if (chain.length < 2) return null
  const shown = chain.slice(0, 6)
  return (
    <ol aria-label="How the day unfolded" className="mt-4 flex flex-wrap items-center gap-2">
      {shown.map((link, index) => {
        const Glyph = ICONS[link.kind]
        const size =
          link.kind === 'listen' ? formatDuration(link.amount) : formatRupees(link.amount)
        return (
          <li key={`${link.kind}-${index}`} className="flex items-center gap-2">
            <span className="chip !min-h-9 cursor-default">
              <Glyph size={16} weight="bold" aria-hidden={true} />
              {NAMES[link.kind]} {link.count > 1 ? `×${link.count}` : ''} · {size}
            </span>
            {index < shown.length - 1 ? (
              <ArrowRight size={14} aria-hidden={true} className="text-ink-3" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
