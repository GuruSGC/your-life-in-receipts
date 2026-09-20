import { PushPin } from '@phosphor-icons/react'
import { memo, type CSSProperties } from 'react'
import type { Receipt } from '@/types'
import { formatRupees } from '@/utils/format'
import { dayOf, formatDay, formatTime } from '@/utils/time'

const KIND_LABEL: Record<Receipt['kind'], string> = {
  listen: 'Listening session',
  ledger: 'Household ledger',
  card: 'Card statement',
}

interface Props {
  receipt: Receipt
  index?: number
  onOpen?: (receipt: Receipt) => void
  showDate?: boolean
  /** Whether the receipt is in the scrapbook. Only shown together with `onPin`. */
  pinned?: boolean
  onPin?: (receipt: Receipt) => void
}

function footnote(receipt: Receipt, showDate: boolean): string {
  const parts: string[] = [KIND_LABEL[receipt.kind]]
  if (receipt.min === null) parts.push('no date')
  else {
    // Most ledger entries carry a date but no time, which parses as midnight; do not print a false 00:00.
    const timed = receipt.kind === 'listen' || receipt.min % 1440 !== 0
    const when = showDate ? formatDay(dayOf(receipt.min)) : ''
    parts.push(
      [when, timed ? formatTime(receipt.min) : ''].filter(Boolean).join(', ') ||
        'time not recorded',
    )
  }
  if (receipt.flagged) parts.push('flagged by the bank')
  return parts.join(' · ')
}

function RowBody({ receipt, showDate }: { receipt: Receipt; showDate: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="mt-2 size-2.5 shrink-0 rounded-full"
        style={{ background: `var(--c-${receipt.theme})` }}
      />
      <span className="min-w-0 flex-1">
        <span className="leader gap-2">
          <span className="truncate font-semibold">{receipt.title}</span>
          {receipt.amount === undefined ? null : (
            <span className="mono shrink-0 text-[0.95rem]">
              {receipt.direction === 'in' ? '+' : ''}
              {formatRupees(receipt.amount)}
            </span>
          )}
        </span>
        <span className="block text-sm text-ink-2">{receipt.detail}</span>
        <span className="mono block text-xs text-ink-3">{footnote(receipt, showDate)}</span>
      </span>
    </>
  )
}

/** One receipt as a printed line: what it was, when, the amount, and a pin for the scrapbook. */
function ReceiptRowBase({ receipt, index = 0, onOpen, showDate = false, pinned, onPin }: Props) {
  const style = { '--i': Math.min(index, 12) } as CSSProperties
  const body = <RowBody receipt={receipt} showDate={showDate} />
  return (
    <li className="print flex items-start gap-1" style={style}>
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(receipt)}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent-soft"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5">{body}</div>
      )}
      {onPin ? (
        <button
          type="button"
          onClick={() => onPin(receipt)}
          aria-pressed={pinned === true}
          aria-label={`${pinned ? 'Remove from' : 'Pin to'} the scrapbook: ${receipt.title}`}
          className="btn btn-ghost mt-1 size-11 shrink-0 !px-0"
        >
          <PushPin size={18} weight={pinned ? 'fill' : 'regular'} aria-hidden={true} />
        </button>
      ) : null}
    </li>
  )
}

/** A row is rebuilt only when its own receipt or pin state changes, which keeps long result lists cheap. */
export const ReceiptRow = memo(ReceiptRowBase)
