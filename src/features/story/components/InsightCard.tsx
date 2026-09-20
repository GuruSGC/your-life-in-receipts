import type { CSSProperties } from 'react'
import type { Insight } from '@/features/insights'
import { useDrawer } from '@/shared/context/DrawerContext'
import { formatDay } from '@/shared/utils/time'

const GROUP_LABEL: Record<Insight['group'], string> = {
  rhythm: 'Rhythm',
  habit: 'Habit',
  era: 'Era',
  link: 'Connection',
  money: 'Money',
  data: 'About the data',
}

const MAX_DAYS = 4

/** A finding with its number, its explanation and the actual days it was found on. */
export function InsightCard({ insight, index = 0 }: { insight: Insight; index?: number }) {
  const { openDay } = useDrawer()
  const style = { '--i': index } as CSSProperties
  return (
    <article className="paper enter flex flex-col p-5" style={style}>
      <p className="mono text-xs uppercase tracking-[0.14em] text-accent">
        {GROUP_LABEL[insight.group]}
      </p>
      <p className="num mt-2 text-[clamp(2rem,1.4rem+2vw,2.75rem)] font-bold leading-none tracking-tight">
        {insight.stat}
      </p>
      <p className="mt-1 text-sm text-ink-2">{insight.statLabel}</p>
      <h3 className="mt-4 text-lg">{insight.headline}</h3>
      <p className="mt-2 text-[0.95rem] text-ink-2">{insight.body}</p>
      {insight.evidenceDays.length > 0 ? (
        <div className="mt-4">
          <p className="mono text-xs text-ink-3">Open the receipts from these days</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {insight.evidenceDays.slice(0, MAX_DAYS).map((day) => (
              <li key={day}>
                <button
                  type="button"
                  className="chip !min-h-11 !px-3 !text-[0.8rem]"
                  onClick={() => openDay(day)}
                >
                  {formatDay(day)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}
