import { formatNumber } from '@/shared/utils/format'
import { formatHour, WEEKDAYS } from '@/shared/utils/time'

const CELL_W = 26
const CELL_H = 26
const LEFT = 44
const TOP = 26
const NIGHT_HOURS = [22, 23, 0, 1, 2, 3]

/** Plays by weekday and hour. Darker means more. The dashed frame marks 22:00 to 04:00. */
export function Heatmap({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1)
  const width = LEFT + 24 * CELL_W
  const height = TOP + 7 * CELL_H + 22
  const cells = hours.map((value, index) => ({
    value,
    day: Math.floor(index / 24),
    hour: index % 24,
  }))
  const peak = cells.reduce(
    (best, cell) => (cell.value > best.value ? cell : best),
    cells[0] ?? { value: 0, day: 0, hour: 0 },
  )
  const description = `Plays by weekday and hour. The busiest cell is ${WEEKDAYS[peak.day]} at ${formatHour(peak.hour)} with ${formatNumber(peak.value)} plays.`
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={description}
      >
        {WEEKDAYS.map((name, day) => (
          <text
            key={name}
            x={LEFT - 8}
            y={TOP + day * CELL_H + CELL_H / 2 + 4}
            textAnchor="end"
            fontSize="12"
            fill="var(--ink-2)"
            className="mono"
          >
            {name}
          </text>
        ))}
        {Array.from({ length: 8 }, (_, step) => step * 3).map((hour) => (
          <text
            key={hour}
            x={LEFT + hour * CELL_W + CELL_W / 2}
            y={TOP - 8}
            textAnchor="middle"
            fontSize="11"
            fill="var(--ink-3)"
            className="mono"
          >
            {String(hour).padStart(2, '0')}
          </text>
        ))}
        {cells.map((cell) => (
          <rect
            key={`${cell.day}-${cell.hour}`}
            x={LEFT + cell.hour * CELL_W + 1}
            y={TOP + cell.day * CELL_H + 1}
            width={CELL_W - 2}
            height={CELL_H - 2}
            rx={4}
            fill={`color-mix(in oklab, var(--accent) ${Math.round(Math.pow(cell.value / max, 0.75) * 100)}%, var(--surface-2))`}
          >
            <title>{`${WEEKDAYS[cell.day]} ${formatHour(cell.hour)}: ${formatNumber(cell.value)} plays`}</title>
          </rect>
        ))}
        {[
          [0, 3],
          [22, 23],
        ].map(([from, to]) => (
          <rect
            key={from}
            x={LEFT + (from ?? 0) * CELL_W}
            y={TOP - 2}
            width={((to ?? 0) - (from ?? 0) + 1) * CELL_W}
            height={7 * CELL_H + 4}
            rx={6}
            fill="none"
            stroke="var(--ink-2)"
            strokeDasharray="5 4"
            strokeWidth={1.5}
          />
        ))}
        <text
          x={width - 4}
          y={height - 4}
          textAnchor="end"
          fontSize="12"
          fill="var(--ink-2)"
          className="mono"
        >
          Dashed frame: 22:00 to 04:00
        </text>
      </svg>
      <div className="sr-only">
        <table>
          <caption>Plays by hour of day, all weekdays together</caption>
          <thead>
            <tr>
              <th scope="col">Hour</th>
              <th scope="col">Plays</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hour) => (
              <tr key={hour}>
                <th scope="row">{formatHour(hour)}</th>
                <td>
                  {formatNumber(
                    hours.filter((_, index) => index % 24 === hour).reduce((a, b) => a + b, 0),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mono mt-1 text-xs text-ink-2">
        Night hours ({NIGHT_HOURS.map((hour) => String(hour).padStart(2, '0')).join(', ')}) are
        framed. Times as recorded.
      </figcaption>
    </figure>
  )
}
