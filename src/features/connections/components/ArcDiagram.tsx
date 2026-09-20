import type { Link } from '@/features/insights'
import { THEME_LABELS } from '@/shared/constants'
import { linkKey } from '../utils/linkKey'

const WIDTH = 900
const ROW = 38
const LEFT = 210
const RIGHT = WIDTH - 210

const pathOpacity = (selected: string | null, key: string): number => {
  if (selected === null) return 0.7
  return selected === key ? 1 : 0.18
}

interface Props {
  links: Link[]
  selected: string | null
  onSelect: (key: string) => void
}

/** Artists on the left, life themes on the right, one curve per surprising overlap. The list beside it is the accessible twin. */
export function ArcDiagram({ links, selected, onSelect }: Props) {
  const artists = [...new Set(links.map((link) => link.artist))]
  const themes = [...new Set(links.map((link) => link.theme))]
  const rows = Math.max(artists.length, themes.length)
  const height = rows * ROW + 20
  const yOf = (index: number, count: number): number =>
    20 + index * ROW + (rows - count) * (ROW / 2) + ROW / 2
  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full" aria-hidden="true">
      {links.map((link) => {
        const y1 = yOf(artists.indexOf(link.artist), artists.length)
        const y2 = yOf(themes.indexOf(link.theme), themes.length)
        const key = linkKey(link)
        const active = selected === key
        return (
          <path
            key={key}
            d={`M ${LEFT} ${y1} C ${(LEFT + RIGHT) / 2} ${y1}, ${(LEFT + RIGHT) / 2} ${y2}, ${RIGHT} ${y2}`}
            fill="none"
            stroke={`var(--c-${link.theme})`}
            strokeWidth={active ? 7 : 2 + Math.min(4, Math.log10(link.bothDays))}
            strokeDasharray={link.lift < 1 ? '6 6' : undefined}
            strokeLinecap="round"
            opacity={pathOpacity(selected, key)}
            className="fade-swap cursor-pointer"
            onClick={() => onSelect(key)}
          />
        )
      })}
      {artists.map((artist, index) => (
        <text
          key={artist}
          x={LEFT - 12}
          y={yOf(index, artists.length) + 5}
          textAnchor="end"
          fontSize="16"
          fill="var(--ink)"
          fontWeight="600"
        >
          {artist}
        </text>
      ))}
      {themes.map((theme, index) => (
        <g key={theme}>
          <circle cx={RIGHT} cy={yOf(index, themes.length)} r={6} fill={`var(--c-${theme})`} />
          <text
            x={RIGHT + 14}
            y={yOf(index, themes.length) + 5}
            fontSize="16"
            fill="var(--ink)"
            fontWeight="600"
          >
            {THEME_LABELS[theme]}
          </text>
        </g>
      ))}
      {artists.map((artist, index) => (
        <circle key={artist} cx={LEFT} cy={yOf(index, artists.length)} r={6} fill="var(--accent)" />
      ))}
    </svg>
  )
}
