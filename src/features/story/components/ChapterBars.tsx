import type { CSSProperties } from 'react'
import type { Chapter, MonthRow } from '@/types'
import { formatDuration, formatRupees } from '@/utils/format'
import { formatMonth } from '@/utils/time'

const WIDTH = 1000
const HEIGHT = 200
const BASE = 165
const TOP = 12

/** Listening minutes per month as bars, with monthly spending as a line when the ledger or card covers the chapter. */
export function ChapterBars({ chapter, months }: { chapter: Chapter; months: MonthRow[] }) {
  const rows = months.filter((row) => row.key >= chapter.startKey && row.key <= chapter.endKey)
  const step = WIDTH / Math.max(rows.length, 1)
  const maxMinutes = Math.max(...rows.map((row) => row.minutes), 1)
  const maxSpend = Math.max(...rows.map((row) => row.spendOut), 0)
  const hasSpend = maxSpend > 0
  const points = rows
    .map(
      (row, index) => `${(index + 0.5) * step},${BASE - (row.spendOut / maxSpend) * (BASE - TOP)}`,
    )
    .join(' ')
  const label = `Listening per month from ${formatMonth(chapter.startKey)} to ${formatMonth(chapter.endKey)}: peak ${formatDuration(maxMinutes)}${hasSpend ? `, with monthly spending up to ${formatRupees(maxSpend)}` : ''}`
  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={label}
      >
        <line x1={0} x2={WIDTH} y1={BASE} y2={BASE} stroke="var(--line-strong)" />
        {rows.map((row, index) => {
          const height = (row.minutes / maxMinutes) * (BASE - TOP)
          const style = { '--i': index } as CSSProperties
          return (
            <rect
              key={row.key}
              className="bar-grow"
              style={style}
              x={index * step + step * 0.14}
              y={BASE - height}
              width={step * 0.72}
              height={Math.max(height, 0)}
              rx={2}
              fill="var(--accent)"
            />
          )
        })}
        {hasSpend ? (
          <polyline
            points={points}
            fill="none"
            stroke="var(--c-food)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        <text x={2} y={HEIGHT - 8} fontSize="13" className="mono" fill="var(--ink-3)">
          {formatMonth(chapter.startKey)}
        </text>
        <text
          x={WIDTH - 2}
          y={HEIGHT - 8}
          fontSize="13"
          className="mono"
          textAnchor="end"
          fill="var(--ink-3)"
        >
          {formatMonth(chapter.endKey)}
        </text>
      </svg>
      <figcaption className="mono mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <span>
          <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-sm bg-accent" />
          Minutes of music per month
        </span>
        {hasSpend ? (
          <span>
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block h-0.5 w-4 bg-[var(--c-food)] align-middle"
            />
            Money spent per month
          </span>
        ) : (
          <span>No spending receipts cover this chapter</span>
        )}
      </figcaption>
    </figure>
  )
}
