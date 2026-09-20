import { MINUTES_PER_DAY } from '@/shared/constants'

const DAY_MS = 86_400_000

/** Times in the data are wall-clock minutes since 1970-01-01, so UTC accessors read them exactly as recorded. */
export const dayOf = (min: number): number => Math.floor(min / MINUTES_PER_DAY)
export const hourOf = (min: number): number => Math.floor((min % MINUTES_PER_DAY) / 60)
/** Monday is 0. 1970-01-01 was a Thursday. */
export const weekdayOf = (min: number): number => (dayOf(min) + 3) % 7
export const yearOf = (min: number): number => new Date(min * 60_000).getUTCFullYear()
export const monthKey = (min: number): string => new Date(min * 60_000).toISOString().slice(0, 7)
export const minOfDay = (day: number): number => day * MINUTES_PER_DAY
export const monthStartMin = (key: string): number => Date.parse(`${key}-01T00:00:00Z`) / 60_000

export function nextMonthKey(key: string): string {
  const [year = 1970, month = 1] = key.split('-').map(Number)
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

export function monthsBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = []
  for (let key = startKey; key <= endKey; key = nextMonthKey(key)) keys.push(key)
  return keys
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' })

export const formatDay = (day: number): string => dateFormat.format(new Date(day * DAY_MS))
export const formatWeekday = (day: number): string => weekdayFormat.format(new Date(day * DAY_MS))
export const formatMonth = (key: string): string =>
  monthFormat.format(new Date(`${key}-01T00:00:00Z`))
export const formatTime = (min: number): string => timeFormat.format(new Date(min * 60_000))
export const formatHour = (hour: number): string => `${String(hour).padStart(2, '0')}:00`
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
