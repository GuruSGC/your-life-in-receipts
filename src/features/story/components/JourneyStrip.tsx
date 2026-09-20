import type { CSSProperties } from 'react'
import type { Chapter, MonthRow } from '@/features/insights'
import { formatMonth } from '@/utils/time'

const WIDTH = 1000
const HEIGHT = 250
const TOP = 34
const BASE = 150
const LANE_LABELS = { ledger: 'household ledger', card: 'card statement' } as const
const LANE_COLOURS = { ledger: 'var(--c-food)', card: 'var(--c-travel)' } as const

interface Props {
  months: MonthRow[]
  chapters: Chapter[]
  /** Highlights one chapter. */
  active?: number
}

function Lane({
  source,
  months,
  step,
  lane,
}: {
  source: 'ledger' | 'card'
  months: MonthRow[]
  step: number
  lane: number
}) {
  const present = months.filter(
    (row) => (source === 'ledger' ? row.ledgerCount : row.cardCount) > 0,
  )
  const first = present[0]
  const last = present.at(-1)
  if (!first || !last) return null
  const x1 = months.indexOf(first) * step
  const x2 = (months.indexOf(last) + 1) * step
  const y = BASE + 44 + lane * 22
  const labelOnRight = x2 < WIDTH - 170
  return (
    <g aria-hidden="true">
      <line
        x1={x1}
        x2={x2}
        y1={y}
        y2={y}
        stroke={LANE_COLOURS[source]}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <text
        x={labelOnRight ? x2 + 10 : x1 - 10}
        y={y + 4}
        textAnchor={labelOnRight ? 'start' : 'end'}
        fontSize="12"
        fill="var(--ink-2)"
        className="mono"
      >
        {LANE_LABELS[source]}
      </text>
    </g>
  )
}

/** Monthly listening as bars, chapter bands behind them, a year axis, and the spans covered by the ledger and the card. */
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
      {months
        .filter((row, index) => row.key.endsWith('-01') && index % 1 === 0)
        .map((row) => (
          <g key={row.key} aria-hidden="true">
            <line
              x1={(indexOfKey.get(row.key) ?? 0) * step}
              x2={(indexOfKey.get(row.key) ?? 0) * step}
              y1={BASE}
              y2={BASE + 6}
              stroke="var(--line-strong)"
            />
            <text
              x={(indexOfKey.get(row.key) ?? 0) * step + 3}
              y={BASE + 20}
              fontSize="12"
              fill="var(--ink-3)"
              className="mono"
            >
              {row.key.slice(2, 4)}
            </text>
          </g>
        ))}
      <Lane source="ledger" months={months} step={step} lane={0} />
      <Lane source="card" months={months} step={step} lane={1} />
    </svg>
  )
}
