import { ArrowRight, Printer } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import type { LifeData } from '@/features/data'
import type { Story } from '@/features/insights'
import { InsightCard } from '@/features/story/components/InsightCard'
import { SurpriseButton } from '@/features/story/components/SurpriseButton'
import { JourneyStrip } from '@/features/story/components/JourneyStrip'
import { TotalsReceipt } from '@/features/story/components/TotalsReceipt'
import { DataGate } from '@/components/DataGate'
import { PageTitle } from '@/components/PageTitle'
import { formatNumber } from '@/utils/format'

const HIGHLIGHTS = ['night-owl', 'peak-year', 'top-link']

/** Page: the whole life as one receipt, the findings easiest to miss, and the journey. */
export default function HomePage() {
  return (
    <>
      <PageTitle kicker="Three exports, one person">A whole life, told in receipts</PageTitle>
      <p className="-mt-3 mb-6 max-w-2xl text-lg text-ink-2 md:mb-8">
        A listening history, a household ledger and a card statement look unrelated. Laid side by
        side they show chapters, habits and quiet connections. Start with the story, or dig through
        the receipts yourself.
      </p>
      <div className="no-print mb-10 flex flex-wrap gap-3">
        <a href="#/story" className="btn btn-primary">
          Start the story <ArrowRight size={18} weight="bold" aria-hidden={true} />
        </a>
        <a href="#/explore" className="btn btn-ghost">
          Search the receipts
        </a>
        <a href="#/connections" className="btn btn-ghost">
          See the connections
        </a>
        <SurpriseButton />
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          <Printer size={18} weight="bold" aria-hidden={true} /> Print the receipt
        </button>
      </div>
      <DataGate>{({ life, story }) => <HomeBody life={life} story={story} />}</DataGate>
    </>
  )
}

function HomeBody({ life, story }: { life: LifeData; story: Story }) {
  const picks = HIGHLIGHTS.map((id) => story.insights.find((insight) => insight.id === id)).filter(
    (insight) => insight !== undefined,
  )
  return (
    <>
      <p className="mb-6 text-[clamp(1.35rem,1rem+1.5vw,2rem)] font-semibold tracking-tight">
        {formatNumber(life.totals.plays)} songs and {formatNumber(life.totals.spendReceipts)}{' '}
        purchases add up to a life.
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-8">
        <TotalsReceipt life={life} />
        <section aria-labelledby="missed-title">
          <h2 id="missed-title" className="mb-3 text-xl">
            Three things easy to miss
          </h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {picks.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        </section>
      </div>

      <section className="paper defer-render mt-10 p-5 md:p-6" aria-labelledby="journey-title">
        <h2 id="journey-title" className="text-xl">
          The journey in {story.chapters.length} chapters
        </h2>
        <p className="mt-1 max-w-2xl text-ink-2">
          Each bar is a month of listening. The chapters are found from the data: where the
          listening changes level and where a new source of receipts begins. Choose one to open it.
        </p>
        <div className="mt-4">
          <JourneyStrip months={story.months} chapters={story.chapters} />
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {story.chapters.map((chapter) => (
            <li
              key={chapter.id}
              className="enter"
              style={{ '--i': chapter.index } as CSSProperties}
            >
              <a
                href={`#/story?chapter=${chapter.index}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 py-2 transition-colors hover:border-accent hover:bg-accent-soft"
              >
                <span className="mono grid size-8 place-items-center rounded-full border border-accent text-sm font-semibold text-accent">
                  {chapter.index}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{chapter.persona}</span>
                  <span className="mono block text-xs text-ink-3">
                    {chapter.startKey.slice(0, 4)} to {chapter.endKey.slice(0, 4)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
