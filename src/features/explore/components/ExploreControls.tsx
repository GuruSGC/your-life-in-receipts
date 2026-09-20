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
  /** How many receipts are pinned to the scrapbook. */
  pinnedCount?: number
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

/** A labelled dropdown. */
function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
        {label}
      </label>
      <select
        id={id}
        className="field mt-1 w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Search box, kind chips, theme, year range and order for the Explore page. */
export function ExploreControls({ filters, years, onChange, onReset, pinnedCount = 0 }: Props) {
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
          <button
            type="button"
            className="chip"
            aria-pressed={filters.pinnedOnly}
            onClick={() => set('pinnedOnly', !filters.pinnedOnly)}
          >
            Scrapbook only ({pinnedCount})
          </button>
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          id="theme"
          label="Theme"
          value={filters.theme}
          options={[
            { value: 'all', label: 'All themes' },
            ...THEMES.map((theme) => ({ value: theme, label: THEME_LABELS[theme] })),
          ]}
          onChange={(value) => set('theme', value as Filters['theme'])}
        />
        <SelectField
          id="from"
          label="From year"
          value={String(filters.yearFrom ?? '')}
          options={[
            { value: '', label: 'Any' },
            ...years.map((year) => ({ value: String(year), label: String(year) })),
          ]}
          onChange={(value) => set('yearFrom', value ? Number(value) : null)}
        />
        <SelectField
          id="to"
          label="To year"
          value={String(filters.yearTo ?? '')}
          options={[
            { value: '', label: 'Any' },
            ...years.map((year) => ({ value: String(year), label: String(year) })),
          ]}
          onChange={(value) => set('yearTo', value ? Number(value) : null)}
        />
        <SelectField
          id="sort"
          label="Order"
          value={filters.sort}
          options={SORTS.map((sort) => ({ value: sort.id, label: sort.label }))}
          onChange={(value) => set('sort', value as SortKey)}
        />
      </div>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Clear filters
      </button>
    </form>
  )
}
