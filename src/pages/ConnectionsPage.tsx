import { useState } from 'react'
import { ArcDiagram } from '@/features/connections/components/ArcDiagram'
import { LinkDetail } from '@/features/connections/components/LinkDetail'
import { linkKey } from '@/features/connections/utils/linkKey'
import type { Link } from '@/features/insights'
import { DataGate } from '@/shared/components/DataGate'
import { PageTitle } from '@/shared/components/PageTitle'
import { THEME_LABELS } from '@/shared/constants'

const WINDOWS = [
  { id: 'diary', label: 'Diary years, 2015 to 2018' },
  { id: 'card', label: 'Card years, 2022 to 2024' },
] as const

function Explorer({ links }: { links: Link[] }) {
  const [windowId, setWindowId] = useState<Link['window']>('diary')
  const [picked, setPicked] = useState<string | null>(null)
  const visible = links.filter((link) => link.window === windowId)
  const selected = visible.find((link) => linkKey(link) === picked) ?? visible[0]
  const selectedKey = selected ? linkKey(selected) : null
  return (
    <>
      <div role="group" aria-label="Period" className="mb-6 flex flex-wrap gap-2">
        {WINDOWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip"
            aria-pressed={windowId === item.id}
            onClick={() => {
              setWindowId(item.id)
              setPicked(null)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="paper max-w-xl p-5 text-ink-2">
          In these years no artist was played noticeably more or less often on days with card
          spending. That is a finding too: the card receipts do not follow the music. A link needs
          at least 8 shared days and a rate at least a quarter away from normal.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
          <div>
            <div className="paper hidden p-4 md:block">
              <ArcDiagram links={visible} selected={selectedKey} onSelect={setPicked} />
              <p className="mono mt-2 text-xs text-ink-3">
                Thicker curves share more days. Dashed curves are pairs that appear less than usual.
              </p>
            </div>
            <h2 className="mb-2 mt-6 text-lg md:mt-6">All {visible.length} connections</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {visible.map((link) => {
                const key = linkKey(link)
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-pressed={selectedKey === key}
                      onClick={() => setPicked(key)}
                      className="paper flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-full"
                        style={{ background: `var(--c-${link.theme})` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {link.artist} and {THEME_LABELS[link.theme].toLowerCase()}
                        </span>
                        <span className="mono block text-xs text-ink-3">
                          {link.bothDays} shared days
                        </span>
                      </span>
                      <span className="mono text-sm font-semibold">{link.lift.toFixed(1)}×</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div aria-live="polite" className="lg:sticky lg:top-24 lg:self-start">
            {selected ? <LinkDetail key={selectedKey} link={selected} /> : null}
          </div>
        </div>
      )}
    </>
  )
}

export default function ConnectionsPage() {
  return (
    <DataGate>
      {({ story }) => (
        <>
          <PageTitle kicker="Where the receipts touch">Music turns up where money does</PageTitle>
          <p className="-mt-3 mb-6 max-w-2xl text-lg text-ink-2 md:mb-8">
            Each connection pairs an artist with a kind of spending. It appears when the two land on
            the same day much more, or much less, often than chance would suggest. Pick one to see
            the numbers and the days behind it.
          </p>
          <Explorer links={story.links} />
        </>
      )}
    </DataGate>
  )
}
