const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatNumber = (value: number): string => whole.format(value)
export const formatCompact = (value: number): string => compact.format(value)
export const formatRupees = (value: number): string => rupee.format(value)
export const formatPercent = (ratio: number, digits = 0): string =>
  `${(ratio * 100).toFixed(digits)}%`

export function formatDuration(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return hours >= 48
    ? `${formatNumber(Math.round(hours / 24))} days`
    : `${hours} h ${minutes % 60} min`
}

export const plural = (count: number, word: string): string =>
  `${formatNumber(count)} ${word}${count === 1 ? '' : 's'}`
