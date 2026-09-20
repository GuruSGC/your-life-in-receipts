import { CARD_THEME, LEDGER_THEME, type Theme } from '@/constants'
import type { Receipt } from '@/types'
import { isStringArray, need, recordOf, rowsOf } from './guards'
import { at, num, str, words, type Decoded } from './decodeShared'

const DIRECTIONS: ('out' | 'in' | 'transfer')[] = ['out', 'in', 'transfer']

/** Chooses the theme of a household ledger entry from its category and subcategory. */
export function ledgerTheme(category: string, subcategory: string): Theme {
  const key = category.toLowerCase()
  if (LEDGER_THEME[key]) return LEDGER_THEME[key]
  const sub = subcategory.toLowerCase()
  if (/netflix|prime|hotstar|movie/.test(sub)) return 'entertainment'
  return 'other'
}

/** Validates the compiled household ledger and turns each entry into a receipt. */
export function decodeLedger(raw: unknown): Decoded {
  const file = recordOf(raw, 'ledger')
  const stats = recordOf(file.stats, 'stats')
  const cats = need(isStringArray(file.cats) ? file.cats : undefined, 'cats')
  const subs = need(isStringArray(file.subs) ? file.subs : undefined, 'subs')
  const modes = need(isStringArray(file.modes) ? file.modes : undefined, 'modes')
  const rows = rowsOf(file.rows, 'rows', 7)
  const receipts = rows.map((row, index): Receipt => {
    const category = at(cats, row[3])
    const sub = at(subs, row[4])
    const mode = at(modes, row[5])
    const note = str(row[6])
    const kind = num(row[2], 'ledger kind')
    return {
      id: `h-${index}`,
      kind: 'ledger',
      min: num(row[0], 'ledger time'),
      title: note || sub || category || 'Unlabelled entry',
      detail: `${[category, sub].filter(Boolean).join(' › ') || 'Uncategorised'}${mode ? `, paid by ${mode}` : ''}`,
      theme: ledgerTheme(category, sub),
      amount: num(row[1], 'ledger amount'),
      direction: DIRECTIONS[kind] ?? 'out',
      search: words(category, sub, note, mode),
    }
  })
  return {
    receipts,
    quality: {
      label: 'Household ledger',
      rows: num(stats.rows, 'stats.rows'),
      kept: receipts.length,
      notes: [
        'Dates are day/month/year and were parsed in that order; some entries carry a time, most do not',
        'Amounts are rupees; the largest entries are transfers and salary, kept as recorded',
        `${receipts.filter((receipt) => !receipt.title || receipt.title === 'Unlabelled entry').length} entries had no note or category`,
      ],
    },
    startMin: num(stats.firstMin, 'firstMin'),
    endMin: num(stats.lastMin, 'lastMin'),
    extra: {},
  }
}

/** Validates the compiled card statement and turns each transaction into a receipt. */
export function decodeCard(raw: unknown): Decoded {
  const file = recordOf(raw, 'card')
  const stats = recordOf(file.stats, 'stats')
  const missing = recordOf(stats.missing, 'stats.missing')
  const cats = need(isStringArray(file.cats) ? file.cats : undefined, 'cats')
  const merchants = need(isStringArray(file.merchants) ? file.merchants : undefined, 'merchants')
  const cities = need(isStringArray(file.cities) ? file.cities : undefined, 'cities')
  const states = need(isStringArray(file.states) ? file.states : undefined, 'states')
  const toReceipt = (row: unknown[], id: string): Receipt => {
    const category = at(cats, row[2])
    const merchant = at(merchants, row[3])
    const city = at(cities, row[4])
    const state = at(states, row[5])
    const place = [city, state].filter(Boolean).join(', ')
    return {
      id,
      kind: 'card',
      min: typeof row[0] === 'number' ? row[0] : null,
      title: merchant || 'Unnamed merchant',
      detail: `${place || 'Place not recorded'}${category ? `, ${category.replace(/_/g, ' ')}` : ''}`,
      theme: CARD_THEME[category] ?? 'other',
      amount: num(row[1], 'card amount'),
      direction: 'out',
      search: words(merchant, category.replace(/_/g, ' '), city, state),
      ...(place ? { place } : {}),
      flagged: row[6] === 1,
    }
  }
  const dated = rowsOf(file.rows, 'rows', 7).map((row, index) => toReceipt(row, `c-${index}`))
  const undated = rowsOf(file.undated, 'undated', 7).map((row, index) =>
    toReceipt(row, `u-${index}`),
  )
  return {
    receipts: [...dated, ...undated],
    quality: {
      label: 'Card statement',
      rows: num(stats.rows, 'stats.rows'),
      kept: dated.length + undated.length,
      notes: [
        `${num(stats.rows, 'rows').toLocaleString('en-US')} rows held only ${num(stats.uniqueTransactions, 'unique').toLocaleString('en-US')} distinct transactions; repeated copies were merged, filling each blank field from another copy`,
        `${num(stats.rowsWithoutId, 'noId')} rows had no transaction id and could not be matched, so they were left out`,
        `${num(stats.droppedNoAmount, 'noAmount')} transactions had no amount and were left out`,
        `${undated.length} receipts had no date. They are kept in "The drawer" and can be searched by merchant and place, but cannot join a day`,
        `Blank fields after merging: merchant ${num(missing.merchant, 'm')}, category ${num(missing.category, 'c')}, city ${num(missing.city, 'ci')}, state ${num(missing.state, 's')}`,
        'Coordinates in the source do not match the stated cities, so no map is drawn; places come from the city and state fields',
      ],
    },
    startMin: num(stats.firstMin, 'firstMin'),
    endMin: num(stats.lastMin, 'lastMin'),
    extra: {},
  }
}
