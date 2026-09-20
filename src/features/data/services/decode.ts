import { CARD_THEME, LEDGER_THEME, MINUTES_PER_DAY, type Theme } from '@/constants'
import type { LifeData, MusicAggregates, Receipt, SourceQuality } from '../types'
import { isNumberArray, isStringArray, need, recordOf, rowsOf } from '../utils/guards'

const num = (value: unknown, what: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Data file has a non-number in ${what}`)
  return value
}
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const at = (list: string[], index: unknown): string =>
  typeof index === 'number' && index >= 0 ? (list[index] ?? '') : ''
const words = (...parts: string[]): string =>
  [
    ...new Set(
      parts
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9₹]+/)
        .filter((word) => word.length > 1),
    ),
  ].join(' ')

export interface Decoded {
  receipts: Receipt[]
  music?: MusicAggregates
  quality: SourceQuality
  startMin: number
  endMin: number
  extra: Record<string, number>
}

export function decodeMusic(raw: unknown): Decoded {
  const file = recordOf(raw, 'music')
  const stats = recordOf(file.stats, 'stats')
  const artists = need(isStringArray(file.artists) ? file.artists : undefined, 'artists')
  const tracks = need(isStringArray(file.tracks) ? file.tracks : undefined, 'tracks')
  const sessions = rowsOf(file.sessions, 'sessions', 11)
  const receipts: Receipt[] = []
  let cursor = 0
  sessions.forEach((row, index) => {
    cursor += num(row[0], 'session start')
    const names = [at(artists, row[4]), at(artists, row[5]), at(artists, row[6])].filter(Boolean)
    const plays = num(row[2], 'session plays')
    const listenMinutes = num(row[1], 'session minutes')
    const lead = at(tracks, row[7])
    const more = names.length > 1 ? ` + ${names.length - 1} more` : ''
    receipts.push({
      id: `l-${index}`,
      kind: 'listen',
      min: cursor,
      title: `${names[0] ?? 'Unknown artist'}${more}`,
      detail: `${plays} plays, ${listenMinutes} min${lead ? `, led by "${lead}"` : ''}`,
      theme: 'music',
      search: words(...names, lead),
      artists: names,
      listenMinutes,
      plays,
      skips: num(row[3], 'session skips'),
      nightPlays: num(row[9], 'session night plays'),
    })
  })
  const comfort = rowsOf(file.comfort, 'comfort', 4).map((row) => ({
    track: at(tracks, row[0]),
    artist: at(artists, row[1]),
    plays: num(row[2], 'comfort plays'),
    years: isNumberArray(row[3]) ? row[3] : [],
  }))
  const byYear = (value: unknown, what: string): Record<string, number> => {
    const record = recordOf(value, what)
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, num(item, what)]))
  }
  const hoursByYear = Object.fromEntries(
    Object.entries(recordOf(file.hoursByYear, 'hoursByYear')).map(([year, list]) => [
      year,
      isNumberArray(list) ? list : [],
    ]),
  )
  const music: MusicAggregates = {
    artists,
    hours: need(isNumberArray(file.hours) ? file.hours : undefined, 'hours'),
    hoursByYear,
    playsByYear: byYear(file.playsByYear, 'playsByYear'),
    skipsByYear: byYear(file.skipsByYear, 'skipsByYear'),
    minutesByMonth: byYear(file.minutesByMonth, 'minutesByMonth'),
    topArtists: rowsOf(file.topArtists, 'topArtists', 2).map((row) => ({
      name: at(artists, row[0]),
      plays: num(row[1], 'top artist plays'),
    })),
    artistYear: rowsOf(file.artistYear, 'artistYear', 3).map((row) => ({
      name: at(artists, row[0]),
      year: num(row[1], 'artist year'),
      plays: num(row[2], 'artist year plays'),
    })),
    newArtistsByYear: byYear(file.newArtistsByYear, 'newArtistsByYear'),
    comfort,
  }
  const rowsRead = num(stats.rows, 'stats.rows')
  return {
    receipts,
    music,
    quality: {
      label: 'Listening history',
      rows: rowsRead,
      kept: num(stats.plays, 'stats.plays'),
      notes: [
        `${num(stats.duplicatesRemoved, 'duplicates')} duplicate plays removed (same timestamp and track)`,
        `${num(stats.plays, 'plays').toLocaleString('en-US')} plays grouped into ${receipts.length.toLocaleString('en-US')} listening sessions (a new session starts after ${num(stats.sessionGapMinutes, 'gap')} quiet minutes)`,
        'Timestamps are UTC as exported; they are shown as recorded, with no timezone shift',
        "A skip means the forward button ended the track. The export's own skipped flag is filled in for only some years, so it was not used",
      ],
    },
    startMin: num(stats.firstMin, 'firstMin'),
    endMin: num(stats.lastMin, 'lastMin'),
    extra: {
      plays: num(stats.plays, 'plays'),
      listenedMinutes: num(stats.listenedMinutes, 'listenedMinutes'),
      artists: num(stats.distinctArtists, 'artists'),
    },
  }
}

const DIRECTIONS: ('out' | 'in' | 'transfer')[] = ['out', 'in', 'transfer']

export function ledgerTheme(category: string, subcategory: string): Theme {
  const key = category.toLowerCase()
  if (LEDGER_THEME[key]) return LEDGER_THEME[key]
  const sub = subcategory.toLowerCase()
  if (/netflix|prime|hotstar|movie/.test(sub)) return 'entertainment'
  return 'other'
}

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

export function indexByDay(receipts: Receipt[]): Map<number, Receipt[]> {
  const byDay = new Map<number, Receipt[]>()
  for (const receipt of receipts) {
    if (receipt.min === null) continue
    const day = Math.floor(receipt.min / MINUTES_PER_DAY)
    const list = byDay.get(day)
    if (list) list.push(receipt)
    else byDay.set(day, [receipt])
  }
  return byDay
}

/** The same life without its receipts, for the first paint. */
export function withoutReceipts(life: LifeData): LifeData {
  return { ...life, complete: false, receipts: [], byDay: new Map() }
}

/** Fills in the receipts once they have all arrived. */
export function withReceipts(life: LifeData, receipts: Receipt[]): LifeData {
  return { ...life, complete: true, receipts, byDay: indexByDay(receipts) }
}

export function assemble(music: Decoded, ledger: Decoded, card: Decoded): LifeData {
  if (!music.music) throw new Error('Music aggregates are missing')
  const receipts = [...music.receipts, ...ledger.receipts, ...card.receipts].sort(
    (a, b) => (a.min ?? Number.MAX_SAFE_INTEGER) - (b.min ?? Number.MAX_SAFE_INTEGER),
  )
  return {
    complete: true,
    receipts,
    byDay: indexByDay(receipts),
    music: music.music,
    quality: [music.quality, ledger.quality, card.quality],
    totals: {
      plays: music.extra.plays ?? 0,
      listenedMinutes: music.extra.listenedMinutes ?? 0,
      sessions: music.receipts.length,
      spendReceipts: ledger.receipts.length + card.receipts.length,
      ledgerReceipts: ledger.receipts.length,
      cardReceipts: card.receipts.length,
      undated: receipts.filter((receipt) => receipt.min === null).length,
      artists: music.extra.artists ?? 0,
    },
    range: {
      startMin: Math.min(music.startMin, ledger.startMin, card.startMin),
      endMin: Math.max(music.endMin, ledger.endMin, card.endMin),
    },
    coverage: {
      ledger: { startMin: ledger.startMin, endMin: ledger.endMin },
      card: { startMin: card.startMin, endMin: card.endMin },
    },
  }
}
