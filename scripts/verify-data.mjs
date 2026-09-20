// G4: recompute headline facts straight from the raw CSV files and compare them with the compiled JSON.
// Every drop is accounted for, and every category in the raw data has a mapped theme (or is reported).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR, readCsvRecords } from './lib/csv.mjs'

const compiled = (name) =>
  JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), 'utf8'))
const problems = []
const check = (ok, message) => {
  if (!ok) problems.push(message)
}

// ---- music
const music = compiled('music')
const { records: spotify } = readCsvRecords(join(DATA_DIR, 'ds1', 'spotify_history.csv'))
const seen = new Set()
let plays = 0
let minutes = 0
const artists = new Set()
for (const row of spotify) {
  const key = `${row.ts}|${row.spotify_track_uri}`
  if (seen.has(key)) continue
  seen.add(key)
  plays += 1
  minutes += Number(row.ms_played) / 60000
  artists.add(row.artist_name)
}
check(
  spotify.length === music.stats.rows,
  `spotify rows ${spotify.length} vs compiled ${music.stats.rows}`,
)
check(plays === music.stats.plays, `plays ${plays} vs compiled ${music.stats.plays}`)
check(
  spotify.length - plays === music.stats.duplicatesRemoved,
  'duplicate accounting does not add up',
)
check(
  Math.abs(Math.round(minutes) - music.stats.listenedMinutes) <= 1,
  `minutes ${Math.round(minutes)} vs ${music.stats.listenedMinutes}`,
)
check(
  artists.size === music.stats.distinctArtists,
  `artists ${artists.size} vs ${music.stats.distinctArtists}`,
)
const sessionPlays = music.sessions.reduce((sum, session) => sum + session[2], 0)
check(sessionPlays === plays, `session plays ${sessionPlays} vs ${plays}`)
check(
  music.stats.badTimestamps === 0 && music.stats.malformedRows === 0,
  'unexpected bad rows in the listening data',
)

// ---- household ledger
const ledger = compiled('ledger')
const { records: household } = readCsvRecords(
  join(DATA_DIR, 'ds2', 'Daily Household Transactions.csv'),
)
const total = household.reduce((sum, row) => sum + Number(row.Amount), 0)
const compiledTotal = ledger.rows.reduce((sum, row) => sum + row[1], 0)
check(
  household.length === ledger.stats.rows,
  `ledger rows ${household.length} vs ${ledger.stats.rows}`,
)
check(
  household.length === ledger.stats.kept + ledger.stats.badDates + ledger.stats.badAmounts,
  'ledger drops are not accounted for',
)
check(Math.abs(total - compiledTotal) < 0.01, `ledger amount ${total} vs ${compiledTotal}`)

// ---- card statement
const card = compiled('card')
const { records: cardRows } = readCsvRecords(
  join(DATA_DIR, 'ds3', 'Augmented_IndiaTransactMultiFacet2024.csv'),
)
const ids = new Set(cardRows.map((row) => row.trans_id).filter(Boolean))
const noId = cardRows.filter((row) => !row.trans_id).length
check(cardRows.length === card.stats.rows, `card rows ${cardRows.length} vs ${card.stats.rows}`)
check(
  ids.size === card.stats.uniqueTransactions,
  `unique ids ${ids.size} vs ${card.stats.uniqueTransactions}`,
)
check(noId === card.stats.rowsWithoutId, `rows without id ${noId} vs ${card.stats.rowsWithoutId}`)
check(ids.size === card.stats.kept + card.stats.droppedNoAmount, 'card drops are not accounted for')
check(
  card.rows.length + card.undated.length === card.stats.kept,
  'card kept count does not match its rows',
)

// ---- every category in the raw data is mapped to a theme, or reported
const constants = readFileSync(new URL('../src/shared/constants/index.ts', import.meta.url), 'utf8')
const mapped = (block, key) =>
  new RegExp(`(^|\\n)\\s*['"]?${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?:`).test(block)
const ledgerBlock = constants.slice(
  constants.indexOf('LEDGER_THEME'),
  constants.indexOf('CARD_THEME'),
)
const cardBlock = constants.slice(constants.indexOf('CARD_THEME'))
const unmappedLedger = new Map()
for (const row of household) {
  const key = row.Category.trim().toLowerCase()
  if (key && !mapped(ledgerBlock, key)) unmappedLedger.set(key, (unmappedLedger.get(key) ?? 0) + 1)
}
const unmappedShare = [...unmappedLedger.values()].reduce((a, b) => a + b, 0) / household.length
console.log(
  `ledger categories without a theme (fall under "Other"): ${[...unmappedLedger].map(([k, n]) => `${k}=${n}`).join(', ') || 'none'} (${(unmappedShare * 100).toFixed(1)}% of rows)`,
)
check(
  unmappedShare < 0.05,
  `too many ledger rows fall under Other: ${(unmappedShare * 100).toFixed(1)}%`,
)
for (const row of cardRows)
  if (row.category && !mapped(cardBlock, row.category))
    problems.push(`card category "${row.category}" has no theme`)

console.log(
  `music ${plays} plays / ledger ${household.length} rows / card ${ids.size} transactions, all reconciled`,
)
if (problems.length) {
  console.error(`DATA-FAIL:\n  ${[...new Set(problems)].join('\n  ')}`)
  process.exit(1)
}
console.log('DATA-OK')
