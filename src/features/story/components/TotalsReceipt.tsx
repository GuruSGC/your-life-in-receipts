import type { CSSProperties } from 'react'
import type { LifeData } from '@/types'
import { receiptTotal, totalsLines } from '@/utils/receipt'

/** The whole dataset as one printed receipt. */
export function TotalsReceipt({ life }: { life: LifeData }) {
  const lines = totalsLines(life)
  return (
    <div>
      <div className="printer" aria-hidden="true" />
      <section className="ticket -mt-2 p-5 pt-7 md:p-6 md:pt-8" aria-labelledby="totals-title">
        <p className="mono text-xs uppercase tracking-[0.14em] text-accent">
          Receipt no. 000148350
        </p>
        <h2 id="totals-title" className="mt-1 text-xl">
          One life, itemised
        </h2>
        <dl className="mt-4 space-y-2.5">
          {lines.map(([name, value], index) => (
            <div key={name} className="leader print" style={{ '--i': index } as CSSProperties}>
              <dt className="text-ink-2">{name}</dt>
              <dd className="mono font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border-t-2 border-dashed border-line-strong pt-3">
          <p className="leader font-semibold">
            <span>Receipts in total</span>
            <span className="mono">{receiptTotal(life)}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
