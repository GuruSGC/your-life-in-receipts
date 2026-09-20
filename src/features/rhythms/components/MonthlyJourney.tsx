import { useState } from 'react'
import type { Chapter, MonthRow } from '@/features/insights'
import { formatDuration, formatNumber, formatPercent, formatRupees } from '@/utils/format'
import { formatMonth } from '@/utils/time'

const WIDTH = 1000
const HEIGHT = 230
const BASE = 200
const TOP = 16

interface Props {
  months: MonthRow[]
  chapters: Chapter[]
}

/** Listening as an area, spending as a line, chapters as bands, and a slider to read any month. */
export function MonthlyJourney({ months, chapters }: Props) {
  const [index, setIndex] = useState(() => {
    const busiest = months.reduce(
      (best, row, i) => (row.minutes > (months[best]?.minutes ?? 0) ? i : best),
      0,
    )
    return busiest
  })
  const step = WIDTH / (months.length - 1)
  const maxMinutes = Math.max(...months.map((row) => row.minutes), 1)
  const maxSpend = Math.max(...months.map((row) => row.spendOut), 1)
  const x = (i: number): number => i * step
  const yMinutes = (value: number): number => BASE - Math.sqrt(value / maxMinutes) * (BASE - TOP)
  const area = `M 0 ${BASE} ${months.map((row, i) => `L ${x(i)} ${yMinutes(row.minutes)}`).join(' ')} L ${WIDTH} ${BASE} Z`
  const spendPaths = splitRuns(months, x, maxSpend)
  const current = months[index] ?? months[0]
  if (!current) return null
  const indexOfKey = new Map(months.map((row, i) => [row.key, i]))
  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Listening and spending by month, ${formatMonth(months[0]?.key ?? '')} to ${formatMonth(months.at(-1)?.key ?? '')}. Use the slider below to read any month.`}
      >
        {chapters.map((chapter) => {
          const from = x(indexOfKey.get(chapter.startKey) ?? 0)
          const to = x(indexOfKey.get(chapter.endKey) ?? 0) + step
          return (
            <rect
              key={chapter.id}
              x={from}
              y={0}
              width={Math.min(to, WIDTH) - from}
              height={BASE}
              fill={chapter.index % 2 ? 'var(--accent-soft)' : 'var(--surface-2)'}
              opacity={0.8}
            />
          )
        })}
        <path d={area} fill="var(--accent)" opacity={0.55} />
        {spendPaths.map((path) => (
          <polyline
            key={path}
            points={path}
            fill="none"
            stroke="var(--c-food)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}
        <line x1={x(index)} x2={x(index)} y1={0} y2={BASE} stroke="var(--ink)" strokeWidth={2} />
        <circle cx={x(index)} cy={yMinutes(current.minutes)} r={6} fill="var(--ink)" />
        <line x1={0} x2={WIDTH} y1={BASE} y2={BASE} stroke="var(--line-strong)" />
        {[0, Math.floor(months.length / 2), months.length - 1].map((i) => (
          <text
            key={i}
            x={Math.min(Math.max(x(i), 2), WIDTH - 50)}
            y={HEIGHT - 6}
            fontSize="13"
            className="mono"
            fill="var(--ink-3)"
          >
            {months[i]?.key.slice(0, 4)}
          </text>
        ))}
      </svg>
      <label
        htmlFor="month-slider"
        className="mono mt-3 block text-xs uppercase tracking-[0.14em] text-ink-2"
      >
        Month, {formatMonth(current.key)}
      </label>
      <input
        id="month-slider"
        type="range"
        min={0}
        max={months.length - 1}
        value={index}
        onChange={(event) => setIndex(Number(event.target.value))}
        aria-valuetext={formatMonth(current.key)}
        className="mt-1 h-11 w-full cursor-pointer accent-[var(--accent)]"
      />
      <dl aria-live="polite" className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Reading label="Songs played" value={formatNumber(current.plays)} />
        <Reading label="Time listening" value={formatDuration(current.minutes)} />
        <Reading
          label="After 22:00, before 04:00"
          value={current.plays ? formatPercent(current.nightPlays / current.plays) : 'none'}
        />
        <Reading
          label="Everyday spending"
          value={current.spendOut ? formatRupees(current.spendOut) : 'no receipts'}
        />
      </dl>
    </div>
  )
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper p-3">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className="num text-lg font-bold">{value}</dd>
    </div>
  )
}

/** Runs of consecutive months with spending, so the line breaks where a source has no receipts. */
function splitRuns(months: MonthRow[], x: (i: number) => number, maxSpend: number): string[] {
  const runs: string[] = []
  let current: string[] = []
  months.forEach((row, i) => {
    if (row.spendOut > 0) current.push(`${x(i)},${BASE - (row.spendOut / maxSpend) * (BASE - TOP)}`)
    else if (current.length) {
      runs.push(current.join(' '))
      current = []
    }
  })
  if (current.length) runs.push(current.join(' '))
  return runs.filter((run) => run.includes(' '))
}
