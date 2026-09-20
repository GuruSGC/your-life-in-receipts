import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assemble, decodeCard, decodeLedger, decodeMusic } from '@/services/data'
import { buildStory } from '@/services/insights'
import { LEDGER_THEME } from '@/constants'

// Expected values come from scripts/verify-insights.mjs, which recomputes them from the raw CSV files.
const expectedFile = '.verify/expected.json'
const read = (name: string): unknown => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'))

interface Expected {
  totalPlays: number
  nightShare: number
  topArtist: string
  topPlays: number
  peakYear: number
  peakPlays: number
  worstYear: number
  worstRate: number
  ledgerExpenseByCategory: Record<string, number>
  beatlesFood: { lift: number; foodDays: number; both: number }
}

describe.skipIf(!existsSync(expectedFile))('findings agree with the raw data', () => {
  const expected = JSON.parse(
    existsSync(expectedFile) ? readFileSync(expectedFile, 'utf8') : '{}',
  ) as Expected
  const life = assemble(
    decodeMusic(read('music')),
    decodeLedger(read('ledger')),
    decodeCard(read('card')),
  )
  const story = buildStory(life)
  const insight = (id: string) => story.insights.find((item) => item.id === id)
  const percent = (ratio: number, digits = 0): string => `${(ratio * 100).toFixed(digits)}%`

  it('counts the same plays', () => {
    expect(life.totals.plays).toBe(expected.totalPlays)
  })

  it('states the night share to the shown precision', () => {
    expect(insight('night-owl')?.stat).toBe(percent(expected.nightShare))
  })

  it('names the most played artist with the same count', () => {
    expect(life.music.topArtists[0]?.name).toBe(expected.topArtist)
    expect(life.music.topArtists[0]?.plays).toBe(expected.topPlays)
    expect(insight('comfort-loop')?.stat).toBe(expected.topPlays.toLocaleString('en-US'))
  })

  it('finds the same loudest year', () => {
    expect(insight('peak-year')?.headline).toContain(String(expected.peakYear))
    expect(insight('peak-year')?.stat).toBe(expected.peakPlays.toLocaleString('en-US'))
  })

  it('finds the same forward-button year and rate', () => {
    expect(insight('restless-year')?.headline).toContain(String(expected.worstYear))
    expect(insight('restless-year')?.stat).toBe(percent(expected.worstRate, 1))
  })

  it('splits everyday spending the way the raw ledger does', () => {
    const themes = new Map<string, number>()
    for (const [category, amount] of Object.entries(
      expected.ledgerExpenseByCategory as Record<string, number>,
    )) {
      const theme = LEDGER_THEME[category] ?? 'other'
      if (theme === 'money') continue
      themes.set(theme, (themes.get(theme) ?? 0) + amount)
    }
    const everyday = [...themes.values()].reduce((sum, value) => sum + value, 0)
    const top = [...themes].filter(([theme]) => theme !== 'other').sort((a, b) => b[1] - a[1])[0]
    expect(insight('money-identity')?.stat).toBe(percent((top?.[1] ?? 0) / everyday))
  })

  it('reproduces the Beatles and food connection within the tolerance of its stated method', () => {
    const link = story.links.find(
      (item) => item.artist === 'The Beatles' && item.theme === 'food' && item.window === 'diary',
    )
    expect(link).toBeDefined()
    // The app counts an artist as played on a day when they lead a session that day; the raw check counts any play.
    expect(link?.themeDays).toBe(expected.beatlesFood.foodDays)
    expect(Math.abs((link?.lift ?? 0) / expected.beatlesFood.lift - 1)).toBeLessThan(0.25)
  })

  it('cites only days that exist, each with at least one receipt', () => {
    for (const item of story.insights) {
      for (const day of item.evidenceDays)
        expect(life.byDay.get(day)?.length ?? 0).toBeGreaterThan(0)
    }
  })
})
