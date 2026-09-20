import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useEffect, useRef, type CSSProperties } from 'react'
import type { LifeData } from '@/features/data'
import type { Chapter, Insight, Story } from '@/features/insights'
import { THEME_LABELS } from '@/shared/constants'
import { useDrawer } from '@/shared/context/DrawerContext'
import { formatDuration, formatNumber, formatPercent, formatRupees } from '@/shared/utils/format'
import { dayOf, formatDay } from '@/shared/utils/time'
import { ChapterBars } from './ChapterBars'
import { InsightCard } from './InsightCard'

interface Props {
  life: LifeData
  story: Story
  chapter: Chapter
  onStep: (index: number) => void
}

function insightsFor(story: Story, chapter: Chapter): Insight[] {
  const first = dayOf(chapter.startMin)
  const last = dayOf(chapter.endMin)
  return story.insights.filter((insight) => {
    const inside = insight.evidenceDays.filter((day) => day >= first && day < last).length
    return insight.evidenceDays.length > 0 && inside / insight.evidenceDays.length >= 0.5
  })
}

function Stat({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div className="paper enter p-4" style={{ '--i': index } as CSSProperties}>
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="num mt-1 text-2xl font-bold tracking-tight">{value}</dd>
    </div>
  )
}

export function ChapterView({ life, story, chapter, onStep }: Props) {
  const { openDay } = useDrawer()
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const total = story.chapters.length
  const found = insightsFor(story, chapter)
  const stats = chapter.stats
  const moment = chapter.momentDay === null ? null : (life.byDay.get(chapter.momentDay) ?? null)

  useEffect(() => {
    if (mounted.current) heading.current?.focus({ preventScroll: true })
    mounted.current = true
  }, [chapter.id])

  return (
    <article key={chapter.id} aria-labelledby="chapter-title">
      <div className="flex flex-wrap items-center gap-4">
        <span className="stamp stamp-in" aria-hidden="true">
          {String(chapter.index).padStart(2, '0')}
        </span>
        <div>
          <p className="mono text-xs uppercase tracking-[0.14em] text-accent">
            Chapter {chapter.index} of {total} · {chapter.title}
          </p>
          <h1
            id="chapter-title"
            ref={heading}
            tabIndex={-1}
            className="text-[clamp(1.9rem,1.2rem+3vw,3.25rem)] outline-none"
          >
            {chapter.persona}
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-lg text-ink-2">{chapter.blurb}</p>
      <p className="mono mt-2 text-xs text-ink-3">
        Receipts in this chapter come from:{' '}
        {chapter.sources.map((source) => SOURCE_LABEL[source]).join(', ')}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat index={0} label="Songs played" value={formatNumber(stats.plays)} />
        <Stat index={1} label="Time listening" value={formatDuration(stats.minutes)} />
        <Stat index={2} label="After 22:00, before 04:00" value={formatPercent(stats.nightShare)} />
        <Stat
          index={3}
          label="Ended with the forward button"
          value={formatPercent(stats.skipRate)}
        />
        <Stat index={4} label="Led by" value={stats.plays ? stats.leadArtist : 'nobody'} />
        <Stat index={5} label="Share of that artist" value={formatPercent(stats.leadShare)} />
        {stats.spend > 0 ? (
          <Stat index={6} label="Everyday spending" value={formatRupees(stats.spend)} />
        ) : null}
        {stats.topTheme ? (
          <Stat
            index={7}
            label={`Top spending: ${THEME_LABELS[stats.topTheme]}`}
            value={formatPercent(stats.topThemeShare)}
          />
        ) : null}
      </dl>

      <section className="paper mt-6 p-5 md:p-6" aria-labelledby="bars-title">
        <h2 id="bars-title" className="mb-3 text-xl">
          Month by month
        </h2>
        <ChapterBars chapter={chapter} months={story.months} />
      </section>

      <section className="mt-8" aria-labelledby="day-title">
        <h2 id="day-title" className="text-xl">
          A day that shows it
        </h2>
        {moment && chapter.momentDay !== null ? (
          <div className="ticket mt-3 max-w-xl p-5">
            <p className="mono text-xs uppercase tracking-[0.14em] text-accent">
              {formatDay(chapter.momentDay)}
            </p>
            <p className="mt-2 text-ink-2">
              The richest day in this chapter: {formatNumber(moment.length)} receipts from{' '}
              {new Set(moment.map((r) => r.kind)).size} different sources.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => openDay(chapter.momentDay ?? 0)}
            >
              Open that day
            </button>
          </div>
        ) : (
          <p className="mt-2 max-w-xl text-ink-2">
            No day in this chapter carries receipts from more than one source, so there is nothing
            to lay side by side. The listening stands alone.
          </p>
        )}
      </section>

      {found.length > 0 ? (
        <section className="mt-8" aria-labelledby="found-title">
          <h2 id="found-title" className="mb-3 text-xl">
            What turned up here
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {found.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <nav aria-label="Chapters" className="mt-10 flex gap-3">
        <button
          type="button"
          className="btn btn-ghost flex-1 md:flex-none"
          disabled={chapter.index <= 1}
          onClick={() => onStep(chapter.index - 1)}
        >
          <ArrowLeft size={18} weight="bold" aria-hidden={true} /> Previous chapter
        </button>
        <button
          type="button"
          className="btn btn-primary flex-1 md:flex-none"
          disabled={chapter.index >= total}
          onClick={() => onStep(chapter.index + 1)}
        >
          Next chapter <ArrowRight size={18} weight="bold" aria-hidden={true} />
        </button>
      </nav>
    </article>
  )
}

const SOURCE_LABEL = {
  music: 'listening history',
  ledger: 'household ledger',
  card: 'card statement',
} as const
