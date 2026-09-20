import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { filtersFromParams, paramsFromFilters } from '@/features/explore/utils/urlState'
import type { Receipt } from '@/features/data'
import { ExploreControls } from '@/features/explore/components/ExploreControls'
import {
  DEFAULT_FILTERS,
  filterReceipts,
  summarise,
  type Filters,
} from '@/features/explore/utils/search'
import { DataGate } from '@/components/DataGate'
import { PageTitle } from '@/components/PageTitle'
import { ReceiptRow } from '@/components/ReceiptRow'
import { useDrawer } from '@/context/drawerApi'
import { usePins } from '@/context/pinsApi'
import { formatDuration, formatNumber, formatRupees } from '@/utils/format'
import { dayOf, yearOf } from '@/utils/time'
import type { LifeData } from '@/features/data'

const PAGE_SIZE = 60

function Results({ life }: { life: LifeData }) {
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromParams(new URLSearchParams(window.location.hash.split('?')[1] ?? '')),
  )
  // Keep the address in step with the search, so a search can be shared. replaceState adds no history entries.
  useEffect(() => {
    const query = paramsFromFilters(filters)
    const next = `#/explore${query ? `?${query}` : ''}`
    if (window.location.hash !== next) window.history.replaceState(null, '', next)
  }, [filters])
  const [shown, setShown] = useState(PAGE_SIZE)
  const { openDay, openReceipt } = useDrawer()
  const deferredQuery = useDeferredValue(filters.query)
  const years = useMemo(() => {
    const from = yearOf(life.range.startMin)
    return Array.from({ length: yearOf(life.range.endMin) - from + 1 }, (_, index) => from + index)
  }, [life])
  const { pinned, toggle } = usePins()
  const found = useMemo(() => {
    const source = filters.pinnedOnly
      ? life.receipts.filter((receipt) => pinned.has(receipt.id))
      : life.receipts
    return filterReceipts(source, { ...filters, query: deferredQuery })
  }, [life, filters, deferredQuery, pinned])
  const totals = useMemo(() => summarise(found), [found])
  const change = useCallback((next: Filters) => {
    setFilters(next)
    setShown(PAGE_SIZE)
  }, [])
  const reset = useCallback(() => change(DEFAULT_FILTERS), [change])
  const open = useCallback(
    (receipt: Receipt) =>
      receipt.min === null ? openReceipt(receipt) : openDay(dayOf(receipt.min)),
    [openDay, openReceipt],
  )
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ExploreControls
          filters={filters}
          years={years}
          onChange={change}
          onReset={reset}
          pinnedCount={pinned.size}
        />
      </div>
      <section aria-labelledby="results-title">
        <h2 id="results-title" className="sr-only">
          Results
        </h2>
        <p role="status" className="mono mb-3 text-sm text-ink-2">
          {formatNumber(totals.count)} receipts
          {totals.minutes ? ` · ${formatDuration(totals.minutes)} of music` : ''}
          {totals.spend ? ` · ${formatRupees(totals.spend)} spent` : ''}
        </p>
        {found.length === 0 ? (
          <div className="paper p-6">
            <p className="font-semibold">Nothing matches</p>
            <p className="mt-1 text-ink-2">
              Try fewer words, another theme, or a wider range of years.
            </p>
            <button type="button" className="btn btn-primary mt-4" onClick={reset}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <ul className="paper divide-y divide-line p-1.5">
              {found.slice(0, shown).map((receipt, index) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  index={index % PAGE_SIZE}
                  onOpen={open}
                  showDate
                  pinned={pinned.has(receipt.id)}
                  onPin={toggle}
                />
              ))}
            </ul>
            {shown < found.length ? (
              <button
                type="button"
                className="btn btn-ghost mt-4 w-full"
                onClick={() => setShown(shown + PAGE_SIZE)}
              >
                Show {formatNumber(Math.min(PAGE_SIZE, found.length - shown))} more of{' '}
                {formatNumber(found.length - shown)} left
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}

/** Page: search and filter every receipt, and open any day. */
export default function ExplorePage() {
  return (
    <DataGate>
      {({ life }) => (
        <>
          <PageTitle kicker="Every receipt, findable">Search the whole life</PageTitle>
          <p className="-mt-3 mb-6 max-w-2xl text-lg text-ink-2 md:mb-8">
            Search across the music, the household ledger and the card statement together. Open any
            receipt to see the rest of that day.
          </p>
          {life.complete ? (
            <Results life={life} />
          ) : (
            <p role="status" className="mono text-sm text-ink-2">
              Loading the receipts…
            </p>
          )}
        </>
      )}
    </DataGate>
  )
}
