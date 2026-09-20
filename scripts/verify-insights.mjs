// G5: recompute the findings from the raw CSV, independently of the app's code, then let the app's engine be checked against them.
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { DATA_DIR, readCsvRecords } from './lib/csv.mjs'

const { records: spotify } = readCsvRecords(join(DATA_DIR, 'ds1', 'spotify_history.csv'))
const seen = new Set()
const plays = []
for (const row of spotify) {
  const key = `${row.ts}|${row.spotify_track_uri}`
  if (seen.has(key)) continue
  seen.add(key)
  plays.push({
    year: Number(row.ts.slice(0, 4)),
    hour: Number(row.ts.slice(11, 13)),
    artist: row.artist_name,
    forward: row.reason_end === 'fwdbtn',
    day: row.ts.slice(0, 10),
  })
}

const night = plays.filter((play) => play.hour >= 22 || play.hour < 4).length
const byArtist = new Map()
const byYear = new Map()
const forwardByYear = new Map()
for (const play of plays) {
  byArtist.set(play.artist, (byArtist.get(play.artist) ?? 0) + 1)
  byYear.set(play.year, (byYear.get(play.year) ?? 0) + 1)
  if (play.forward) forwardByYear.set(play.year, (forwardByYear.get(play.year) ?? 0) + 1)
}
const [topArtist, topPlays] = [...byArtist].sort((a, b) => b[1] - a[1])[0]
const [peakYear, peakPlays] = [...byYear].sort((a, b) => b[1] - a[1])[0]
const busy = [...byYear].filter(([, n]) => n >= 2000)
const rates = busy.map(([year, n]) => [year, (forwardByYear.get(year) ?? 0) / n])
const [worstYear, worstRate] = rates.sort((a, b) => b[1] - a[1])[0]

// The Beatles on food-spending days in the household diary window, from play-level data.
const { records: household } = readCsvRecords(
  join(DATA_DIR, 'ds2', 'Daily Household Transactions.csv'),
)
const toDay = (text) => {
  const [d, m, y] = text.split(' ')[0].split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
const foodDays = new Set(
  household
    .filter((row) => row.Category.trim().toLowerCase() === 'food')
    .map((row) => toDay(row.Date)),
)
const allLedgerDays = household.map((row) => toDay(row.Date)).sort()
const start = Date.parse(`${allLedgerDays[0]}T00:00:00Z`) / 86400000
const end = Date.parse(`${allLedgerDays.at(-1)}T00:00:00Z`) / 86400000
const beatlesDays = new Set(
  plays.filter((play) => play.artist === 'The Beatles').map((play) => play.day),
)
const inWindow = (day) => {
  const value = Date.parse(`${day}T00:00:00Z`) / 86400000
  return value >= start && value <= end
}
const windowBeatles = [...beatlesDays].filter(inWindow).length
const both = [...foodDays].filter((day) => beatlesDays.has(day)).length
const lift = both / foodDays.size / (windowBeatles / (end - start + 1))

const byCategory = {}
for (const row of household) {
  if (row['Income/Expense'] !== 'Expense') continue
  const key = row.Category.trim().toLowerCase()
  byCategory[key] ??= 0
  byCategory[key] += Number(row.Amount)
}

const expected = {
  totalPlays: plays.length,
  nightShare: night / plays.length,
  topArtist,
  topPlays,
  peakYear,
  peakPlays,
  worstYear,
  worstRate,
  ledgerExpenseByCategory: byCategory,
  beatlesFood: { lift, foodDays: foodDays.size, both },
}
mkdirSync('.verify', { recursive: true })
writeFileSync('.verify/expected.json', JSON.stringify(expected, null, 2))
console.log(
  `raw facts: ${plays.length} plays, ${(expected.nightShare * 100).toFixed(1)}% at night, top artist ${topArtist} (${topPlays}), peak ${peakYear} (${peakPlays}), Beatles on food days ${lift.toFixed(2)}x`,
)

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const run = spawnSync(
  npx,
  ['vitest', 'run', 'tests/independent.test.ts', '--coverage.enabled=false'],
  { encoding: 'utf8', shell: process.platform === 'win32' },
)
process.stdout.write(
  (run.stdout + run.stderr)
    .split('\n')
    .filter((line) => /✓|×|FAIL|Tests|AssertionError|expected/.test(line))
    .join('\n') + '\n',
)
if (run.status !== 0) {
  console.error('INSIGHTS-FAIL: the app disagrees with the raw data')
  process.exit(1)
}
console.log('INSIGHTS-OK')
