import type { LifeData, MonthRow } from '@/types'
import { monthKey } from '@/utils/time'
import { sse } from './stats'

const MIN_MONTHS = 6
export const TARGET_CHAPTERS = 7

export interface Segment {
  from: number
  to: number
}

interface Split {
  index: number
  at: number
  gain: number
}

/** Forced cut points where a data source starts or stops, as month indexes into the series. */
export function sourceCuts(life: LifeData, months: MonthRow[]): number[] {
  const indexOf = (min: number): number => months.findIndex((row) => row.key === monthKey(min))
  const cuts = new Set<number>()
  for (const { startMin, endMin } of [life.coverage.ledger, life.coverage.card]) {
    const start = indexOf(startMin)
    const end = indexOf(endMin) + 1
    if (start > 0) cuts.add(start)
    if (end > 0 && end < months.length) cuts.add(end)
  }
  return [...cuts].sort((a, b) => a - b)
}

function bestSplit(levels: number[], segment: Segment): { at: number; gain: number } | null {
  if (segment.to - segment.from < MIN_MONTHS * 2) return null
  const whole = sse(levels, segment.from, segment.to)
  let best: { at: number; gain: number } | null = null
  for (let at = segment.from + MIN_MONTHS; at <= segment.to - MIN_MONTHS; at += 1) {
    const gain = whole - sse(levels, segment.from, at) - sse(levels, at, segment.to)
    if (!best || gain > best.gain) best = { at, gain }
  }
  return best
}

/** Binary segmentation of log listening minutes, starting from the forced source boundaries. */
export function segmentMonths(
  levels: number[],
  forcedCuts: number[],
  target = TARGET_CHAPTERS,
): Segment[] {
  const edges = [0, ...forcedCuts, levels.length]
  let segments: Segment[] = []
  for (let i = 0; i < edges.length - 1; i += 1)
    segments.push({ from: edges[i] ?? 0, to: edges[i + 1] ?? levels.length })
  while (segments.length < target) {
    let pick: Split | null = null
    segments.forEach((segment, index) => {
      const split = bestSplit(levels, segment)
      if (split && (!pick || split.gain > pick.gain)) pick = { index, ...split }
    })
    const chosen = pick as Split | null
    const victim = chosen ? segments[chosen.index] : undefined
    if (!chosen || !victim) break
    segments = [
      ...segments.slice(0, chosen.index),
      { from: victim.from, to: chosen.at },
      { from: chosen.at, to: victim.to },
      ...segments.slice(chosen.index + 1),
    ]
  }
  return segments
}
