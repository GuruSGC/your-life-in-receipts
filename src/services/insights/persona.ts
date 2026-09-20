export interface Traits {
  level: number
  nightShare: number
  skipRate: number
  leadShare: number
  avgSession: number
  newLeadRate: number
}

const relative = (value: number, base: number): number => (base ? value / base - 1 : 0)

/**
 * Names a chapter after the trait that sets it furthest apart from the whole timeline.
 * `avoid` keeps neighbouring chapters from sharing a name.
 */
export function pickPersona(t: Traits, base: Traits, lead: string, avoid = ''): string {
  const candidates: [string, number][] = [
    ['The Quiet Stretch', (0.5 - t.level) / 0.2],
    ['The Explorer', relative(t.newLeadRate, base.newLeadRate) / 0.5],
    [`The ${lead.replace(/^The /, '')} Loyalist`, (t.leadShare - base.leadShare) / 0.05],
    ['The Night Shift', (t.nightShare - base.nightShare) / 0.04],
    ['The Soundtrack Years', (t.level - 1) / 0.5],
    ['The Restless Thumb', relative(t.skipRate, base.skipRate) / 0.5],
    ['The Long Listen', relative(t.avgSession, base.avgSession) / 0.3],
  ]
  const ranked = candidates
    .filter(([name, score]) => score >= 0.5 && name !== avoid)
    .sort((a, b) => b[1] - a[1])
  return ranked[0]?.[0] ?? 'The Steady Rhythm'
}
