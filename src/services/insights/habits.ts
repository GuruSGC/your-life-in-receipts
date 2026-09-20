import type { LifeData, Receipt } from '@/types'
import { formatNumber, formatPercent } from '@/utils/format'
import { dayOf, formatHour, formatDay, yearOf } from '@/utils/time'
import { sum } from './stats'
import type { DayFacts, Insight, MonthRow } from '@/types'

const topDays = (
  facts: Map<number, DayFacts>,
  score: (fact: DayFacts) => number,
  count = 8,
  keep?: (fact: DayFacts) => boolean,
): number[] =>
  [...facts.values()]
    .filter((fact) => (keep ? keep(fact) : true) && score(fact) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, count)
    .map((fact) => fact.day)

const listens = (life: LifeData): Receipt[] =>
  life.receipts.filter((receipt) => receipt.kind === 'listen')

/** Finding: how much of the listening happens late at night. */
export function nightOwl(life: LifeData, facts: Map<number, DayFacts>): Insight {
  const night = sum(listens(life).map((receipt) => receipt.nightPlays ?? 0))
  const share = night / life.totals.plays
  const hourTotals = Array.from({ length: 24 }, (_, hour) =>
    sum(life.music.hours.filter((_, index) => index % 24 === hour)),
  )
  const peak = hourTotals.indexOf(Math.max(...hourTotals))
  return {
    id: 'night-owl',
    group: 'rhythm',
    headline: 'The night is when the music happens',
    body: `${formatPercent(share)} of all plays land between 22:00 and 04:00 (6 of the 24 hours, so an even day would give 25%). The busiest single hour is ${formatHour(peak)}. Times are shown as recorded.`,
    stat: formatPercent(share),
    statLabel: 'of plays after 22:00 and before 04:00',
    evidenceDays: topDays(facts, (fact) => fact.nightPlays),
  }
}

/** Finding: the artist and the songs that keep coming back. */
export function comfortLoop(life: LifeData, facts: Map<number, DayFacts>): Insight {
  const top = life.music.topArtists[0]
  const name = top?.name ?? 'One artist'
  const plays = top?.plays ?? 0
  const songs = life.music.comfort.length
  return {
    id: 'comfort-loop',
    group: 'habit',
    headline: `${name} is the constant`,
    body: `${name} account for ${formatPercent(plays / life.totals.plays, 1)} of ${formatNumber(life.totals.plays)} plays. ${songs} songs came back in at least six different years, led by "${life.music.comfort[0]?.track ?? 'one song'}".`,
    stat: formatNumber(plays),
    statLabel: `plays of ${name}`,
    evidenceDays: topDays(
      facts,
      (fact) => fact.listenMinutes,
      8,
      (fact) => fact.artists.has(name),
    ),
  }
}

/** Finding: the loudest year of listening. */
export function peakYear(life: LifeData, facts: Map<number, DayFacts>): Insight {
  const years = Object.entries(life.music.playsByYear).map(([year, plays]) => ({
    year: Number(year),
    plays,
  }))
  const peak = years.reduce(
    (best, item) => (item.plays > best.plays ? item : best),
    years[0] ?? { year: 0, plays: 0 },
  )
  const before = years.find((item) => item.year === peak.year - 1)?.plays ?? 0
  const change = before ? peak.plays / before - 1 : 0
  const direction = change >= 0 ? 'more' : 'fewer'
  const versus = before
    ? `, ${formatPercent(Math.abs(change))} ${direction} than ${peak.year - 1}`
    : ''
  return {
    id: 'peak-year',
    group: 'era',
    headline: `${peak.year} was the loudest year`,
    body: `${formatNumber(peak.plays)} plays in ${peak.year}${versus}. That is ${formatPercent(peak.plays / life.totals.plays)} of everything ever played.`,
    stat: formatNumber(peak.plays),
    statLabel: `plays in ${peak.year}`,
    evidenceDays: topDays(
      facts,
      (fact) => fact.listenMinutes,
      8,
      (fact) => yearOf(fact.day * 1440) === peak.year,
    ),
  }
}

/** Finding: the year the forward button was used most. */
export function restlessYear(life: LifeData): Insight | null {
  const rows = Object.entries(life.music.playsByYear)
    .map(([year, plays]) => ({
      year: Number(year),
      rate: (life.music.skipsByYear[year] ?? 0) / plays,
      plays,
    }))
    .filter((row) => row.plays >= 2000)
  if (rows.length < 2) return null
  const worst = rows.reduce((best, row) => (row.rate > best.rate ? row : best))
  const calm = rows.reduce((best, row) => (row.rate < best.rate ? row : best))
  const skips = new Map<number, number>()
  for (const receipt of listens(life)) {
    if (receipt.min !== null && yearOf(receipt.min) === worst.year)
      skips.set(dayOf(receipt.min), (skips.get(dayOf(receipt.min)) ?? 0) + (receipt.skips ?? 0))
  }
  return {
    id: 'restless-year',
    group: 'habit',
    headline: `In ${worst.year} the forward button got busy`,
    body: `${formatPercent(worst.rate, 1)} of plays in ${worst.year} ended with the forward button, against ${formatPercent(calm.rate, 1)} in ${calm.year}. The export's own skipped flag is filled in for only some years, so forward-button endings are used instead.`,
    stat: formatPercent(worst.rate, 1),
    statLabel: `skipped ahead in ${worst.year}`,
    evidenceDays: [...skips]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([day]) => day),
  }
}

/** Finding: how the pace of discovering new artists changed. */
export function explorerToLoyalist(life: LifeData, facts: Map<number, DayFacts>): Insight | null {
  const years = Object.entries(life.music.newArtistsByYear).map(([year, count]) => ({
    year: Number(year),
    count,
  }))
  const busy = years.filter((item) => (life.music.playsByYear[String(item.year)] ?? 0) >= 2000)
  if (busy.length < 2) return null
  const explorer = busy.reduce((best, item) => (item.count > best.count ? item : best))
  const latest = busy.at(-1) ?? explorer
  return {
    id: 'explorer-loyalist',
    group: 'era',
    headline: 'From explorer to loyalist',
    body: `In ${explorer.year} you first played ${formatNumber(explorer.count)} artists you had never played before. In ${latest.year} it was ${formatNumber(latest.count)}. The taste settled.`,
    stat: formatNumber(explorer.count),
    statLabel: `new artists in ${explorer.year}`,
    evidenceDays: topDays(
      facts,
      (fact) => fact.artists.size,
      8,
      (fact) => yearOf(fact.day * 1440) === explorer.year,
    ),
  }
}

/** Finding: the longest unbroken run of listening days. */
export function streaks(
  life: LifeData,
  facts: Map<number, DayFacts>,
  months: MonthRow[],
): Insight | null {
  const first = dayOf(life.range.startMin)
  let best = { start: first, length: 0 }
  let run = { start: first, length: 0 }
  for (let day = first; day <= dayOf(life.range.endMin); day += 1) {
    if ((facts.get(day)?.plays ?? 0) > 0) {
      if (run.length === 0) run = { start: day, length: 0 }
      run.length += 1
      if (run.length > best.length) best = { ...run }
    } else run.length = 0
  }
  if (best.length < 5) return null
  const quiet = months.filter((row) => row.plays === 0).length
  return {
    id: 'streak',
    group: 'habit',
    headline: `${best.length} days without a silent day`,
    body: `The longest unbroken run of listening starts on ${formatDay(best.start)} and lasts ${best.length} days. There are also ${quiet} months with no listening at all.`,
    stat: String(best.length),
    statLabel: 'days in a row',
    evidenceDays: [
      best.start,
      best.start + Math.floor(best.length / 2),
      best.start + best.length - 1,
    ],
  }
}
