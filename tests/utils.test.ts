import { beforeEach, describe, expect, it } from 'vitest'
import { parseHash } from '@/hooks/useHashRoute'
import { readJson, writeJson } from '@/services/storage'
import {
  formatCompact,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRupees,
  plural,
} from '@/utils/format'
import {
  formatDay,
  formatHour,
  formatMonth,
  formatTime,
  formatWeekday,
  hourOf,
  monthKey,
  monthStartMin,
  yearOf,
} from '@/utils/time'
import {
  isNumberArray,
  isRecord,
  isStringArray,
  need,
  recordOf,
  rowsOf,
} from '@/services/data/guards'

describe('hash routes', () => {
  it('parses the route and its query, falling back to the home page', () => {
    expect(parseHash('#/story?chapter=3')).toMatchObject({ route: 'story' })
    expect(parseHash('#/story?chapter=3').params.get('chapter')).toBe('3')
    expect(parseHash('').route).toBe('receipt')
    expect(parseHash('#/nowhere').route).toBe('receipt')
    expect(parseHash('#/explore').route).toBe('explore')
  })
})

describe('storage service', () => {
  beforeEach(() => localStorage.clear())
  const isNumber = (value: unknown): value is number => typeof value === 'number'

  it('round-trips valid data and falls back on missing, invalid or corrupt data', () => {
    expect(readJson('k', isNumber, 7)).toBe(7)
    writeJson('k', 5)
    expect(readJson('k', isNumber, 7)).toBe(5)
    writeJson('k', 'text')
    expect(readJson('k', isNumber, 7)).toBe(7)
    localStorage.setItem('k', '{not json')
    expect(readJson('k', isNumber, 7)).toBe(7)
  })
})

describe('formatters', () => {
  it('formats numbers, money, percentages and durations', () => {
    expect(formatNumber(148350)).toBe('148,350')
    expect(formatCompact(1500)).toBe('1.5K')
    expect(formatRupees(1057004)).toMatch(/10,57,004/)
    expect(formatPercent(0.376)).toBe('38%')
    expect(formatPercent(0.0526, 1)).toBe('5.3%')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(135)).toBe('2 h 15 min')
    expect(formatDuration(317000)).toBe('220 days')
    expect(plural(1, 'session')).toBe('1 session')
    expect(plural(2, 'session')).toBe('2 sessions')
  })

  it('reads recorded wall-clock times without a timezone shift', () => {
    const min = Date.UTC(2017, 8, 6, 2, 30) / 60000
    expect(hourOf(min)).toBe(2)
    expect(yearOf(min)).toBe(2017)
    expect(monthKey(min)).toBe('2017-09')
    expect(formatTime(min)).toBe('02:30')
    expect(formatDay(Math.floor(min / 1440))).toBe('6 Sept 2017')
    expect(formatWeekday(Math.floor(min / 1440))).toBe('Wednesday')
    expect(formatMonth('2017-09')).toBe('Sept 2017')
    expect(formatHour(5)).toBe('05:00')
    expect(monthStartMin('1970-01')).toBe(0)
  })
})

describe('data guards', () => {
  it('accepts the right shapes and rejects the rest with readable errors', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isStringArray(['a'])).toBe(true)
    expect(isStringArray([1])).toBe(false)
    expect(isNumberArray([1, 2])).toBe(true)
    expect(() => need(undefined, 'things')).toThrow(/missing things/)
    expect(need(3, 'x')).toBe(3)
    expect(() => recordOf(null, 'x')).toThrow(/not an object/)
    expect(() => rowsOf('nope', 'x', 1)).toThrow(/not a list/)
    expect(() => rowsOf([[1]], 'x', 2)).toThrow(/short row/)
    expect(rowsOf([[1, 2]], 'x', 2)).toHaveLength(1)
  })
})
