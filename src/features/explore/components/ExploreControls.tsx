import { MagnifyingGlass } from '@phosphor-icons/react'
import type { ReceiptKind } from '@/features/data'
import { MAX_SEARCH_LENGTH, THEMES, THEME_LABELS } from '@/constants'
import type { Filters, SortKey } from '../utils/search'

const KIND_OPTIONS: { id: ReceiptKind; label: string }[] = [
  { id: 'listen', label: 'Music' },
  { id: 'ledger', label: 'Household ledger' },
  { id: 'card', label: 'Card statement' },
]

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'largest', label: 'Largest amount' },
  { id: 'longest', label: 'Longest listen' },
]

interface Props {
  filters: Filters
  years: number[]
  onChange: (next: Filters) => void
  onReset: () => void
}

export function ExploreControls({ filters, years, onChange, onReset }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]): void =>
    onChange({ ...filters, [key]: value })
  const toggleKind = (kind: ReceiptKind): void => {
    const has = filters.kinds.includes(kind)
    const next = has ? filters.kinds.filter((item) => item !== kind) : [...filters.kinds, kind]
    set('kinds', next)
  }
  return (
    <form
      role="search"
      aria-label="Search the receipts"
      className="paper space-y-4 p-4 md:p-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <label htmlFor="q" className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
          Search
        </label>
        <div className="relative mt-1">
          <MagnifyingGlass
            size={20}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden={true}
          />
          <input
            id="q"
            type="search"
            className="field w-full !pl-11"
            placeholder="An artist, a merchant, a place, a word from a note"
            value={filters.query}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={(event) => set('query', event.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      <fieldset>
        <legend className="mono mb-1 text-xs uppercase tracking-[0.14em] text-ink-2">
          Kind of receipt
        </legend>
        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="chip"
              aria-pressed={filters.kinds.includes(option.id)}
              onClick={() => toggleKind(option.id)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            aria-pressed={filters.includeUndated}
            onClick={() => set('includeUndated', !filters.includeUndated)}
          >
            Include the drawer (no date)
          </button>
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label htmlFor="theme" className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
            Theme
          </label>
          <select
            id="theme"
            className="field mt-1 w-full"
            value={filters.theme}
            onChange={(event) => set('theme', event.target.value as Filters['theme'])}
          >
            <option value="all">All themes</option>
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
            From year
          </label>
          <select
            id="from"
            className="field mt-1 w-full"
            value={filters.yearFrom ?? ''}
            onChange={(event) =>
              set('yearFrom', event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Any</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="to" className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
            To year
          </label>
          <select
            id="to"
            className="field mt-1 w-full"
            value={filters.yearTo ?? ''}
            onChange={(event) =>
              set('yearTo', event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Any</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
            Order
          </label>
          <select
            id="sort"
            className="field mt-1 w-full"
            value={filters.sort}
            onChange={(event) => set('sort', event.target.value as SortKey)}
          >
            {SORTS.map((sort) => (
              <option key={sort.id} value={sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Clear filters
      </button>
    </form>
  )
}
