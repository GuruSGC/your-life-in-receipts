import type { Link } from '@/features/insights'
import { THEME_LABELS } from '@/constants'
import { useDrawer } from '@/context/drawerApi'
import { formatNumber, formatPercent } from '@/utils/format'
import { formatDay } from '@/utils/time'

function RateBar({ label, ratio, strong }: { label: string; ratio: number; strong?: boolean }) {
  return (
    <div>
      <div className="leader text-sm">
        <span>{label}</span>
        <span className="mono font-semibold">{formatPercent(ratio)}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          className="fade-swap h-full origin-left rounded-full"
          style={{
            transform: `scaleX(${Math.min(ratio, 1)})`,
            background: strong ? 'var(--accent)' : 'var(--line-strong)',
          }}
        />
      </div>
    </div>
  )
}

export function LinkDetail({ link }: { link: Link }) {
  const { openDay } = useDrawer()
  const theme = THEME_LABELS[link.theme].toLowerCase()
  const more = link.lift >= 1
  return (
    <div className="paper p-5 md:p-6">
      <p className="mono text-xs uppercase tracking-[0.14em] text-accent">
        {link.window === 'diary' ? 'Household diary years' : 'Card statement years'}
      </p>
      <h2 className="mt-1 text-2xl">
        {link.artist} and {theme}
      </h2>
      <p className="num mt-3 text-4xl font-bold tracking-tight">
        {link.lift.toFixed(1)}×
        <span className="ml-2 text-base font-normal text-ink-2">
          {more ? 'more likely' : 'less likely'} than usual
        </span>
      </p>
      <p className="mt-3 text-ink-2">
        On days with {theme} receipts, {link.artist} was played on{' '}
        {formatPercent(link.conditionalRate)} of them. On any day in the same period the rate was{' '}
        {formatPercent(link.baseRate)}. That is {formatNumber(link.bothDays)} shared days out of{' '}
        {formatNumber(link.themeDays)}.
      </p>
      <div className="mt-4 space-y-3">
        <RateBar label={`${link.artist} on ${theme} days`} ratio={link.conditionalRate} strong />
        <RateBar label={`${link.artist} on any day`} ratio={link.baseRate} />
      </div>
      <p className="mono mt-4 text-xs text-ink-3">
        Days that overlap; open one to see every receipt
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {link.sampleDays.map((day) => (
          <li key={day}>
            <button
              type="button"
              className="chip !px-3 !text-[0.8rem]"
              onClick={() => openDay(day)}
            >
              {formatDay(day)}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-dashed border-line-strong pt-3 text-sm text-ink-3">
        A pattern of co-occurrence, not a cause. Both are common on busy days, so the rate is
        compared with all days in the same window.
      </p>
    </div>
  )
}
