import { MagnifyingGlass } from '@phosphor-icons/react'
import type { ChangeEvent, FormEvent } from 'react'
import { ValueButton } from '@/components/ValueButton'
import type { ReceiptKind } from '@/types'
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
const ignoreSubmit = (event: FormEvent): void => event.preventDefault()

function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  const change = (event: ChangeEvent<HTMLSelectElement>): void => onChange(event.target.value)
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mono text-xs uppercase tracking-[0.14em] text-ink-2">
        {label}
      </label>
      <select id={id} className="field mt-1 w-full min-w-0" value={value} onChange={change}>
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
  const typeQuery = (event: ChangeEvent<HTMLInputElement>): void => set('query', event.target.value)
  const toggleUndated = (): void => set('includeUndated', !filters.includeUndated)
  const togglePinned = (): void => set('pinnedOnly', !filters.pinnedOnly)
  const setTheme = (value: string): void => set('theme', value as Filters['theme'])
  const setYearFrom = (value: string): void => set('yearFrom', value ? Number(value) : null)
  const setYearTo = (value: string): void => set('yearTo', value ? Number(value) : null)
  const setSort = (value: string): void => set('sort', value as SortKey)
  return (
    <form
      role="search"
      aria-label="Search the receipts"
      className="paper space-y-4 p-4 md:p-5"
      onSubmit={ignoreSubmit}
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
            onChange={typeQuery}
            autoComplete="off"
          />
        </div>
      </div>
      <fieldset className="min-w-0">
        <legend className="mono mb-1 text-xs uppercase tracking-[0.14em] text-ink-2">
          Kind of receipt
        </legend>
        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map((option) => (
            <ValueButton
              key={option.id}
              value={option.id}
              onPick={toggleKind}
              className="chip"
              aria-pressed={filters.kinds.includes(option.id)}
            >
              {option.label}
            </ValueButton>
          ))}
          <button
            type="button"
            className="chip"
            aria-pressed={filters.includeUndated}
            onClick={toggleUndated}
          >
            Include the drawer (no date)
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={filters.pinnedOnly}
            onClick={togglePinned}
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
          onChange={setTheme}
        />
        <SelectField
          id="from"
          label="From year"
          value={String(filters.yearFrom ?? '')}
          options={[
            { value: '', label: 'Any' },
            ...years.map((year) => ({ value: String(year), label: String(year) })),
          ]}
          onChange={setYearFrom}
        />
        <SelectField
          id="to"
          label="To year"
          value={String(filters.yearTo ?? '')}
          options={[
            { value: '', label: 'Any' },
            ...years.map((year) => ({ value: String(year), label: String(year) })),
          ]}
          onChange={setYearTo}
        />
        <SelectField
          id="sort"
          label="Order"
          value={filters.sort}
          options={SORTS.map((sort) => ({ value: sort.id, label: sort.label }))}
          onChange={setSort}
        />
      </div>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Clear filters
      </button>
    </form>
  )
}
