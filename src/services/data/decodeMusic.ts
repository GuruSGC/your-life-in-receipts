import type { MusicAggregates, Receipt } from '@/types'
import { isNumberArray, isStringArray, need, recordOf, rowsOf } from './guards'
import { at, num, words, type Decoded } from './decodeShared'

/** Validates the compiled listening file and turns each session into a receipt. */
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
