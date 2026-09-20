// Compiles the three supplied datasets into small JSON files under public/data.
// Raw files stay outside the repository (LIFE_DATA_DIR, default ../life-data). Times are kept exactly as recorded
// (wall clock, no timezone shift); the Spotify export is UTC and the app says so.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA_DIR, readCsvRecords } from './lib/csv.mjs'

const OUT = fileURLToPath(new URL('../public/data/', import.meta.url))
mkdirSync(OUT, { recursive: true })
const minutes = (ms) => Math.floor(ms / 60000)
const SESSION_GAP_MIN = 30
const SEP = ' @@ '

class Table {
  constructor() {
    this.items = []
    this.index = new Map()
  }
  id(value) {
    const key = value ?? ''
    if (!this.index.has(key)) {
      this.index.set(key, this.items.length)
      this.items.push(key)
    }
    return this.index.get(key)
  }
}

// ---------------------------------------------------------------- music
function buildMusic() {
  const { records, malformed } = readCsvRecords(join(DATA_DIR, 'ds1', 'spotify_history.csv'))
  const seen = new Set()
  const plays = []
  let duplicates = 0
  let badTimestamps = 0
  for (const row of records) {
    const stamp = row.ts?.match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)$/)
    if (!stamp) {
      badTimestamps += 1
      continue
    }
    const key = `${row.ts}|${row.spotify_track_uri}`
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
    const [, y, mo, d, h, mi] = stamp.map(Number)
    plays.push({
      min: minutes(Date.UTC(y, mo - 1, d, h, mi)),
      year: y,
      hour: h,
      weekday: (new Date(Date.UTC(y, mo - 1, d)).getUTCDay() + 6) % 7,
      ms: Number(row.ms_played) || 0,
      track: row.track_name,
      artist: row.artist_name,
      // The export's own skipped flag is only filled in for some years (79% in 2015, 0% in 2018), so a skip here
      // means the forward button ended the track, which is recorded consistently in every year.
      skipped: row.reason_end === 'fwdbtn',
    })
  }
  plays.sort((a, b) => a.min - b.min)

  const artistPlays = new Map()
  const trackPlays = new Map()
  const trackYears = new Map()
  for (const play of plays) {
    artistPlays.set(play.artist, (artistPlays.get(play.artist) ?? 0) + 1)
    const trackKey = `${play.track}${SEP}${play.artist}`
    trackPlays.set(trackKey, (trackPlays.get(trackKey) ?? 0) + 1)
    if (!trackYears.has(trackKey)) trackYears.set(trackKey, new Set())
    trackYears.get(trackKey).add(play.year)
  }

  const artists = new Table()
  const tracks = new Table()
  const sessions = []
  let current = null
  const flush = () => {
    if (!current) return
    const counts = new Map()
    const trackCounts = new Map()
    for (const play of current.plays) {
      counts.set(play.artist, (counts.get(play.artist) ?? 0) + 1)
      const key = `${play.track}${SEP}${play.artist}`
      trackCounts.set(key, (trackCounts.get(key) ?? 0) + 1)
    }
    const topArtists = [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => artists.id(name))
    while (topArtists.length < 3) topArtists.push(-1)
    const topTracks = [...trackCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => tracks.id(key.split(SEP)[0]))
    while (topTracks.length < 2) topTracks.push(-1)
    const night = current.plays.filter((play) => play.hour >= 22 || play.hour < 4).length
    sessions.push([
      current.start,
      Math.round(current.plays.reduce((sum, play) => sum + play.ms, 0) / 60000),
      current.plays.length,
      current.plays.filter((play) => play.skipped).length,
      ...topArtists,
      ...topTracks,
      night,
      counts.size,
    ])
    current = null
  }
  for (const play of plays) {
    if (current && play.min - current.last > SESSION_GAP_MIN) flush()
    if (!current) current = { start: play.min, last: play.min, plays: [] }
    current.plays.push(play)
    current.last = play.min
  }
  flush()

  // The first field of each session is delta-encoded against the previous start to keep the file small.
  let previous = 0
  const encoded = sessions.map((session) => {
    const delta = session[0] - previous
    previous = session[0]
    return [delta, ...session.slice(1)]
  })

  const hours = Array(168).fill(0)
  const hoursByYear = {}
  const playsByYear = {}
  const minutesByMonth = {}
  const skipsByYear = {}
  for (const play of plays) {
    hours[play.weekday * 24 + play.hour] += 1
    hoursByYear[play.year] ??= Array(24).fill(0)
    hoursByYear[play.year][play.hour] += 1
    playsByYear[play.year] = (playsByYear[play.year] ?? 0) + 1
    if (play.skipped) skipsByYear[play.year] = (skipsByYear[play.year] ?? 0) + 1
    const month = new Date(play.min * 60000).toISOString().slice(0, 7)
    minutesByMonth[month] = (minutesByMonth[month] ?? 0) + play.ms / 60000
  }

  const topArtists = [...artistPlays].sort((a, b) => b[1] - a[1]).slice(0, 12)
  const yearArtist = new Map()
  for (const play of plays) {
    const key = `${play.year}${SEP}${play.artist}`
    yearArtist.set(key, (yearArtist.get(key) ?? 0) + 1)
  }
  const topSet = new Set(topArtists.map(([name]) => name))
  const artistYear = []
  for (const [key, count] of yearArtist) {
    const [year, name] = key.split(SEP)
    if (topSet.has(name)) artistYear.push([artists.id(name), Number(year), count])
  }

  const firstSeen = new Map()
  for (const play of plays) if (!firstSeen.has(play.artist)) firstSeen.set(play.artist, play.year)
  const newArtistsByYear = {}
  for (const year of firstSeen.values()) newArtistsByYear[year] = (newArtistsByYear[year] ?? 0) + 1

  const comfort = [...trackPlays]
    .filter(([key]) => trackYears.get(key).size >= 6)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, count]) => {
      const [track, artist] = key.split(SEP)
      return [tracks.id(track), artists.id(artist), count, [...trackYears.get(key)].sort()]
    })

  const topArtistRows = topArtists.map(([name, count]) => [artists.id(name), count])
  const totalMs = plays.reduce((sum, play) => sum + play.ms, 0)
  return {
    v: 1,
    unit: 'minutes since 1970-01-01, wall clock as recorded (UTC)',
    stats: {
      rows: records.length + malformed,
      malformedRows: malformed,
      badTimestamps,
      duplicatesRemoved: duplicates,
      plays: plays.length,
      listenedMinutes: Math.round(totalMs / 60000),
      sessions: sessions.length,
      sessionGapMinutes: SESSION_GAP_MIN,
      skipped: plays.filter((play) => play.skipped).length,
      firstMin: plays[0].min,
      lastMin: plays.at(-1).min,
      distinctArtists: artistPlays.size,
    },
    artists: artists.items,
    tracks: tracks.items,
    sessionFields: [
      'gapMin',
      'listenedMin',
      'plays',
      'skips',
      'a1',
      'a2',
      'a3',
      't1',
      't2',
      'nightPlays',
      'distinctArtists',
    ],
    sessions: encoded,
    hours,
    hoursByYear,
    playsByYear,
    skipsByYear,
    minutesByMonth: Object.fromEntries(
      Object.entries(minutesByMonth).map(([k, v]) => [k, Math.round(v)]),
    ),
    artistYear,
    topArtists: topArtistRows,
    newArtistsByYear,
    comfort,
  }
}

// ---------------------------------------------------------------- household ledger
function tidyCase(text) {
  const value = text.trim().replace(/\s+/g, ' ')
  return value ? value[0].toUpperCase() + value.slice(1) : ''
}

function buildLedger() {
  const { records, malformed } = readCsvRecords(
    join(DATA_DIR, 'ds2', 'Daily Household Transactions.csv'),
  )
  const cats = new Table()
  const subs = new Table()
  const modes = new Table()
  const rows = []
  let badDates = 0
  let badAmounts = 0
  for (const row of records) {
    const date = row.Date?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2}))?/)
    if (!date) {
      badDates += 1
      continue
    }
    const [, d, mo, y, h = '0', mi = '0'] = date
    const amount = Number(row.Amount)
    if (!Number.isFinite(amount)) {
      badAmounts += 1
      continue
    }
    const kind =
      row['Income/Expense'] === 'Income' ? 1 : row['Income/Expense'] === 'Transfer-Out' ? 2 : 0
    rows.push([
      minutes(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))),
      amount,
      kind,
      cats.id(tidyCase(row.Category)),
      subs.id(tidyCase(row.Subcategory)),
      modes.id(tidyCase(row.Mode)),
      row.Note.trim().replace(/\s+/g, ' '),
    ])
  }
  rows.sort((a, b) => a[0] - b[0])
  return {
    v: 1,
    unit: 'minutes since 1970-01-01, wall clock as recorded; source dates are day/month/year',
    stats: {
      rows: records.length + malformed,
      malformedRows: malformed,
      badDates,
      badAmounts,
      kept: rows.length,
      firstMin: rows[0][0],
      lastMin: rows.at(-1)[0],
      currency: 'INR',
    },
    fields: ['min', 'amount', 'kind', 'cat', 'sub', 'mode', 'note'],
    kinds: ['expense', 'income', 'transfer'],
    cats: cats.items,
    subs: subs.items,
    modes: modes.items,
    rows,
  }
}

// ---------------------------------------------------------------- card ledger
function buildCard() {
  const { records, malformed } = readCsvRecords(
    join(DATA_DIR, 'ds3', 'Augmented_IndiaTransactMultiFacet2024.csv'),
  )
  const byId = new Map()
  let noId = 0
  for (const row of records) {
    const id = row.trans_id
    if (!id) {
      noId += 1
      continue
    }
    if (!byId.has(id)) byId.set(id, { ...row })
    else {
      const merged = byId.get(id)
      for (const [key, value] of Object.entries(row)) if (!merged[key] && value) merged[key] = value
    }
  }
  const cats = new Table()
  const merchants = new Table()
  const cities = new Table()
  const states = new Table()
  const dated = []
  const undated = []
  let missingAmount = 0
  const missing = { merchant: 0, category: 0, city: 0, state: 0, date: 0 }
  for (const row of byId.values()) {
    const amount = Number(row.amt)
    if (!row.amt || !Number.isFinite(amount)) {
      missingAmount += 1
      continue
    }
    const date = row.trans_date_trans_time?.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})$/,
    )
    const merchant = row.merchant.replace(/^fraud_/, '').trim()
    if (!merchant) missing.merchant += 1
    if (!row.category) missing.category += 1
    if (!row.city) missing.city += 1
    if (!row.state) missing.state += 1
    const min = date
      ? minutes(
          Date.UTC(
            Number(date[3]),
            Number(date[1]) - 1,
            Number(date[2]),
            Number(date[4]),
            Number(date[5]),
          ),
        )
      : null
    if (min === null) missing.date += 1
    const flagged = row.is_fraud === '' ? 2 : row.is_fraud === '1.0' || row.is_fraud === '1' ? 1 : 0
    const tx = [
      min,
      amount,
      cats.id(row.category),
      merchants.id(merchant),
      cities.id(row.city),
      states.id(row.state),
      flagged,
    ]
    ;(min === null ? undated : dated).push(tx)
  }
  dated.sort((a, b) => a[0] - b[0])
  return {
    v: 1,
    unit: 'minutes since 1970-01-01, wall clock as recorded; source dates are month/day/year',
    stats: {
      rows: records.length + malformed,
      malformedRows: malformed,
      rowsWithoutId: noId,
      uniqueTransactions: byId.size,
      mergedDuplicates: records.length - noId - byId.size,
      droppedNoAmount: missingAmount,
      kept: dated.length + undated.length,
      undated: undated.length,
      missing,
      firstMin: dated[0][0],
      lastMin: dated.at(-1)[0],
      currency: 'INR',
    },
    fields: ['min', 'amount', 'cat', 'merchant', 'city', 'state', 'flagged'],
    cats: cats.items,
    merchants: merchants.items,
    cities: cities.items,
    states: states.items,
    rows: dated,
    undated,
  }
}

for (const [name, build] of [
  ['music', buildMusic],
  ['ledger', buildLedger],
  ['card', buildCard],
]) {
  const data = build()
  const json = JSON.stringify(data)
  writeFileSync(join(OUT, `${name}.json`), json)
  console.log(`${name}.json  ${(json.length / 1024).toFixed(0)} KB`, JSON.stringify(data.stats))
}
