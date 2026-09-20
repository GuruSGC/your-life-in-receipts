import type { LifeData } from '@/types'

const MIN_SOURCES = 2

/** A random day on which at least two different kinds of receipt were recorded, or null if there is none. */
export function pickSurpriseDay(life: LifeData, random: () => number = Math.random): number | null {
  const days: number[] = []
  for (const [day, receipts] of life.byDay) {
    if (new Set(receipts.map((receipt) => receipt.kind)).size >= MIN_SOURCES) days.push(day)
  }
  if (days.length === 0) return null
  return days[Math.min(days.length - 1, Math.floor(random() * days.length))] ?? null
}
