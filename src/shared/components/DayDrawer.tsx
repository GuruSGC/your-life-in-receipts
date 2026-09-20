import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import type { LifeData, Receipt } from '@/features/data'
import { useReady } from '@/shared/context/DataContext'
import { useDrawer, type DrawerTarget } from '@/shared/context/DrawerContext'
import { formatDuration, formatNumber, formatRupees, plural } from '@/shared/utils/format'
import { formatDay, formatWeekday } from '@/shared/utils/time'
import { ReceiptRow } from './ReceiptRow'

const SEARCH_LIMIT_DAYS = 400

function neighbour(life: LifeData, day: number, step: 1 | -1): number | null {
  for (let offset = 1; offset <= SEARCH_LIMIT_DAYS; offset += 1) {
    const candidate = day + step * offset
    if (life.byDay.has(candidate)) return candidate
  }
  return null
}

function summarise(receipts: Receipt[]): string {
  const listens = receipts.filter((receipt) => receipt.kind === 'listen')
  const spends = receipts.filter(
    (receipt) => receipt.kind !== 'listen' && receipt.direction === 'out',
  )
  const parts: string[] = []
  if (listens.length) {
    const minutes = listens.reduce((total, receipt) => total + (receipt.listenMinutes ?? 0), 0)
    const artists = [...new Set(listens.flatMap((receipt) => receipt.artists ?? []))].slice(0, 3)
    parts.push(
      `${formatDuration(minutes)} of music in ${plural(listens.length, 'session')}, mostly ${artists.join(', ')}`,
    )
  }
  if (spends.length) {
    const total = spends.reduce((sum, receipt) => sum + (receipt.amount ?? 0), 0)
    parts.push(`${formatRupees(total)} spent over ${plural(spends.length, 'receipt')}`)
  }
  return parts.length ? `${parts.join('; ')}.` : 'Nothing else was recorded.'
}

function DayContent({
  life,
  day,
  onDay,
}: {
  life: LifeData
  day: number
  onDay: (day: number) => void
}) {
  const receipts = life.byDay.get(day) ?? []
  const before = neighbour(life, day, -1)
  const after = neighbour(life, day, 1)
  return (
    <>
      <p className="mono text-xs uppercase tracking-[0.14em] text-accent">{formatWeekday(day)}</p>
      <h2 id="drawer-title" className="mt-1 text-2xl">
        {formatDay(day)}
      </h2>
      <p className="mt-2 text-ink-2">{summarise(receipts)}</p>
      <p className="mono mt-1 text-xs text-ink-3">
        {formatNumber(receipts.length)} receipts, times as recorded
      </p>
      <ul className="mt-4 divide-y divide-line">
        {receipts.slice(0, 60).map((receipt, index) => (
          <ReceiptRow key={receipt.id} receipt={receipt} index={index} />
        ))}
      </ul>
      {receipts.length > 60 ? (
        <p className="mt-2 text-sm text-ink-3">Showing the first 60 of {receipts.length}.</p>
      ) : null}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          className="btn btn-ghost flex-1"
          disabled={before === null}
          onClick={() => before !== null && onDay(before)}
        >
          <ArrowLeft size={18} weight="bold" aria-hidden={true} /> Earlier day
        </button>
        <button
          type="button"
          className="btn btn-ghost flex-1"
          disabled={after === null}
          onClick={() => after !== null && onDay(after)}
        >
          Later day <ArrowRight size={18} weight="bold" aria-hidden={true} />
        </button>
      </div>
    </>
  )
}

function DrawerBody(props: {
  target: NonNullable<DrawerTarget>
  life: LifeData
  onDay: (day: number) => void
}) {
  const { target, life, onDay } = props
  if (target.kind === 'receipt') {
    return (
      <>
        <h2 id="drawer-title" className="text-2xl">
          A receipt with no date
        </h2>
        <p className="mt-2 text-ink-2">
          The source left the date blank, so this receipt cannot be placed on a day or joined to the
          music. It stays in the drawer.
        </p>
        <ul className="mt-4">
          <ReceiptRow receipt={target.receipt} />
        </ul>
      </>
    )
  }
  if (!life.complete) {
    return (
      <p role="status" className="mono text-sm text-ink-2">
        Loading the receipts…
      </p>
    )
  }
  return <DayContent life={life} day={target.day} onDay={onDay} />
}

/** A modal sheet showing everything recorded on one day, or a single undated receipt. */
export function DayDrawer() {
  const { target, close, openDay } = useDrawer()
  const ready = useReady()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (target && !dialog.open) dialog.showModal()
    if (!target && dialog.open) dialog.close()
  }, [target])

  return (
    // A backdrop click is a pointer shortcut only; Escape and the Close button cover the keyboard.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      className="drawer fixed inset-x-0 bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-line bg-surface p-0 text-ink shadow-2xl md:inset-auto md:m-auto md:max-w-xl md:rounded-2xl"
    >
      {target && ready ? (
        <div className="p-5 md:p-6">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="btn btn-ghost float-right size-11 !px-0"
          >
            <X size={20} weight="bold" aria-hidden={true} />
          </button>
          <DrawerBody target={target} life={ready.life} onDay={openDay} />
        </div>
      ) : null}
    </dialog>
  )
}
