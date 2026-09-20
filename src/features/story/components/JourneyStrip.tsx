import type { CSSProperties } from 'react'
import type { Chapter, MonthRow } from '@/features/insights'
import { formatMonth } from '@/shared/utils/time'

const WIDTH = 1000
const HEIGHT = 190
const TOP = 34
const BASE = 150

interface Props {
  months: MonthRow[]
  chapters: Chapter[]
  /** Highlights one chapter. */
  active?: number
}

/** Monthly listening as bars, chapter bands behind them, and the spans covered by the ledger and the card. */
export function JourneyStrip({ months, chapters, active }: Props) {
  const step = WIDTH / months.length
  const max = Math.max(...months.map((row) => row.minutes), 1)
  const indexOfKey = new Map(months.map((row, index) => [row.key, index]))
  const label = `Monthly listening from ${formatMonth(months[0]?.key ?? '')} to ${formatMonth(months.at(-1)?.key ?? '')}, split into ${chapters.length} chapters`
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="group"
      aria-label={label}
    >
      {chapters.map((chapter) => {
        const from = (indexOfKey.get(chapter.startKey) ?? 0) * step
        const to = ((indexOfKey.get(chapter.endKey) ?? 0) + 1) * step
        const isActive = active === chapter.index
        return (
          <a
            key={chapter.id}
            href={`#/story?chapter=${chapter.index}`}
            aria-label={`Chapter ${chapter.index}: ${chapter.persona}, ${chapter.title}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <rect
              x={from}
              y={0}
              width={to - from}
              height={BASE + 8}
              fill={isActive || chapter.index % 2 ? 'var(--accent-soft)' : 'var(--surface-2)'}
              opacity={isActive ? 1 : 0.85}
            />
            <text
              x={from + 6}
              y={20}
              fontSize="15"
              className="mono"
              fill={isActive ? 'var(--accent)' : 'var(--ink-3)'}
              fontWeight="600"
            >
              {chapter.index}
            </text>
          </a>
        )
      })}
      {months.map((row, index) => {
        const height = Math.sqrt(row.minutes / max) * (BASE - TOP)
        if (height < 0.5) return null
        const style = { '--i': index } as CSSProperties
        return (
          <rect
            key={row.key}
            className="bar-grow"
            style={style}
            x={index * step + step * 0.12}
            y={BASE - height}
            width={step * 0.76}
            height={height}
            fill="var(--accent)"
            rx={1}
            aria-hidden="true"
          />
        )
      })}
      <line x1={0} x2={WIDTH} y1={BASE} y2={BASE} stroke="var(--line-strong)" />
      {(['ledger', 'card'] as const).map((source, lane) => {
        const present = months.filter(
          (row) => (source === 'ledger' ? row.ledgerCount : row.cardCount) > 0,
        )
        const first = present[0]
        const last = present.at(-1)
        if (!first || !last) return null
        const x1 = (indexOfKey.get(first.key) ?? 0) * step
        const x2 = ((indexOfKey.get(last.key) ?? 0) + 1) * step
        const y = BASE + 16 + lane * 16
        return (
          <g key={source} aria-hidden="true">
            <line
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke={source === 'ledger' ? 'var(--c-food)' : 'var(--c-travel)'}
              strokeWidth={5}
              strokeLinecap="round"
            />
            <text x={x1} y={y + 14} fontSize="11" fill="var(--ink-2)" className="mono">
              {source === 'ledger' ? 'household ledger' : 'card statement'}
            </text>
          </g>
        )
      })}
      {[months[0], months[Math.floor(months.length / 2)], months.at(-1)].map((row) =>
        row ? (
          <text
            key={row.key}
            x={Math.min(Math.max((indexOfKey.get(row.key) ?? 0) * step, 4), WIDTH - 60)}
            y={HEIGHT - 2}
            fontSize="12"
            fill="var(--ink-3)"
            className="mono"
          >
            {row.key.slice(0, 4)}
          </text>
        ) : null,
      )}
    </svg>
  )
}
