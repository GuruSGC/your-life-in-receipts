import { useState, type CSSProperties } from 'react'
import type { MusicAggregates } from '@/features/data'
import { formatNumber } from '@/utils/format'

const WIDTH = 1000
const HEIGHT = 240
const BASE = 210
const TOP = 10
const PALETTE = ['music', 'food', 'travel', 'home', 'health', 'shopping', 'entertainment', 'family']
const LIMIT = PALETTE.length

/** Plays per year for the eight most played artists, stacked. Choose an artist to isolate it. */
export function ArtistStreams({ music }: { music: MusicAggregates }) {
  const [focus, setFocus] = useState<string | null>(null)
  const artists = music.topArtists.slice(0, LIMIT).map((artist) => artist.name)
  const years = Object.keys(music.playsByYear)
    .map(Number)
    .sort((a, b) => a - b)
  const barW = WIDTH / years.length
  const max = Math.max(...years.map((year) => music.playsByYear[String(year)] ?? 0), 1)
  const playsOf = (name: string, year: number): number =>
    music.artistYear.find((row) => row.name === name && row.year === year)?.plays ?? 0
  const colour = (name: string): string => `var(--c-${PALETTE[artists.indexOf(name)] ?? 'other'})`
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-2" aria-label="Artists">
        {artists.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="chip !text-[0.8rem]"
              aria-pressed={focus === name}
              onClick={() => setFocus(focus === name ? null : name)}
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: colour(name) }}
              />
              {name}
            </button>
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Plays per year, stacked by the eight most played artists. The remaining plays are shown in grey."
      >
        {years.map((year, column) => {
          const total = music.playsByYear[String(year)] ?? 0
          let cursor = BASE
          const scale = (BASE - TOP) / max
          const segments = artists.map((name) => {
            const value = playsOf(name, year)
            const height = value * scale
            cursor -= height
            return { name, value, y: cursor, height }
          })
          const restHeight =
            Math.max(total - segments.reduce((sum, s) => sum + s.value, 0), 0) * scale
          const style = { '--i': column } as CSSProperties
          return (
            <g key={year} className="bar-grow" style={style}>
              {segments.map((segment) => (
                <rect
                  key={segment.name}
                  x={column * barW + barW * 0.14}
                  y={segment.y}
                  width={barW * 0.72}
                  height={Math.max(segment.height, 0)}
                  fill={colour(segment.name)}
                  opacity={focus && focus !== segment.name ? 0.15 : 1}
                >
                  <title>{`${year}, ${segment.name}: ${formatNumber(segment.value)} plays`}</title>
                </rect>
              ))}
              <rect
                x={column * barW + barW * 0.14}
                y={cursor - restHeight}
                width={barW * 0.72}
                height={restHeight}
                fill="var(--line-strong)"
                opacity={focus ? 0.15 : 0.6}
              >
                <title>{`${year}, everyone else: ${formatNumber(Math.round(restHeight / scale))} plays`}</title>
              </rect>
              <text
                x={column * barW + barW / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="13"
                className="mono"
                fill="var(--ink-3)"
              >
                {String(year).slice(2)}
              </text>
            </g>
          )
        })}
        <line x1={0} x2={WIDTH} y1={BASE} y2={BASE} stroke="var(--line-strong)" />
      </svg>
    </div>
  )
}
