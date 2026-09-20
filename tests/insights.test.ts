import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assemble, decodeCard, decodeLedger, decodeMusic } from '@/features/data'
import { buildStory } from '@/features/insights'
import { segmentMonths, pickPersona } from '@/features/insights/chapters'
import { pearson, quantile, median } from '@/features/insights/stats'
import { monthsBetween, nextMonthKey, weekdayOf, dayOf } from '@/utils/time'

const read = (name: string): unknown => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'))
const life = assemble(
  decodeMusic(read('music')),
  decodeLedger(read('ledger')),
  decodeCard(read('card')),
)
const story = buildStory(life)

describe('statistics helpers', () => {
  it('computes correlation, median and quantile', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1)
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1)
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0)
    expect(median([5, 1, 3])).toBe(3)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(3)
  })
})

describe('time helpers', () => {
  it('walks months across a year end and reads weekdays from epoch days', () => {
    expect(nextMonthKey('2015-12')).toBe('2016-01')
    expect(monthsBetween('2015-11', '2016-02')).toEqual([
      '2015-11',
      '2015-12',
      '2016-01',
      '2016-02',
    ])
    expect(weekdayOf(Date.UTC(2015, 0, 5) / 60000)).toBe(0)
    expect(dayOf(1440)).toBe(1)
  })
})

describe('chapter segmentation', () => {
  it('splits a level shift and respects forced cuts and minimum length', () => {
    const levels = [...Array(12).fill(1), ...Array(12).fill(6)] as number[]
    const segments = segmentMonths(levels, [], 2)
    expect(segments).toEqual([
      { from: 0, to: 12 },
      { from: 12, to: 24 },
    ])
    expect(segmentMonths(levels, [8], 3).some((segment) => segment.to === 8)).toBe(true)
    expect(segmentMonths([1, 2, 3], [], 5)).toHaveLength(1)
  })

  it('names personas from measured traits', () => {
    const base = {
      level: 1,
      nightShare: 0.3,
      skipRate: 0.05,
      leadShare: 0.1,
      avgSession: 30,
      newLeadRate: 0.1,
    }
    expect(pickPersona({ ...base, level: 0.1 }, base, 'X')).toBe('The Quiet Stretch')
    expect(pickPersona({ ...base, leadShare: 0.4 }, base, 'The Beatles')).toBe(
      'The Beatles Loyalist',
    )
    expect(pickPersona({ ...base, nightShare: 0.5 }, base, 'X')).toBe('The Night Shift')
    expect(pickPersona(base, base, 'X')).toBe('The Steady Rhythm')
  })
})

describe('the story built from the real data', () => {
  it('produces chapters that tile the whole timeline without gaps or overlaps', () => {
    expect(story.chapters.length).toBeGreaterThanOrEqual(5)
    for (let i = 1; i < story.chapters.length; i += 1) {
      expect(story.chapters[i]?.startMin).toBe(story.chapters[i - 1]?.endMin)
    }
    expect(story.chapters[0]?.startKey).toBe(story.months[0]?.key)
    expect(story.chapters.at(-1)?.endKey).toBe(story.months.at(-1)?.key)
  })

  it('cuts chapters where the ledger and the card statement begin and end', () => {
    const cuts = new Set(story.chapters.map((chapter) => chapter.startKey))
    expect(cuts.has('2015-01')).toBe(true)
    expect(cuts.has('2018-10')).toBe(true)
  })

  it('cites evidence days that exist in the data for every insight that has evidence', () => {
    for (const insight of story.insights) {
      for (const day of insight.evidenceDays) expect(story.facts.has(day)).toBe(true)
    }
    expect(
      story.insights.filter((insight) => insight.evidenceDays.length > 0).length,
    ).toBeGreaterThanOrEqual(9)
  })

  it('finds cross-source links with support', () => {
    expect(story.links.length).toBeGreaterThan(3)
    for (const link of story.links) {
      expect(link.bothDays).toBeGreaterThanOrEqual(8)
      expect(link.lift).not.toBeCloseTo(1, 1)
    }
  })

  it('keeps monthly plays equal to the total plays', () => {
    const plays = story.months.reduce((total, month) => total + month.plays, 0)
    expect(plays).toBe(
      life.receipts.filter((r) => r.kind === 'listen').reduce((t, r) => t + (r.plays ?? 0), 0),
    )
  })
})
