/** Adds up a list of numbers. */
export const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
/** The average of a list of numbers, or 0 for an empty list. */
export const mean = (values: number[]): number => (values.length ? sum(values) / values.length : 0)

/** The middle value of a list of numbers, or 0 for an empty list. */
export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

/** The value at a given fraction of the way through the sorted numbers. */
export function quantile(values: number[], q: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0
}

/** The Pearson correlation of two lists, from -1 to 1, or 0 when it is undefined. */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return 0
  const mx = mean(xs.slice(0, n))
  const my = mean(ys.slice(0, n))
  let covariance = 0
  let vx = 0
  let vy = 0
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] ?? 0) - mx
    const dy = (ys[i] ?? 0) - my
    covariance += dx * dy
    vx += dx * dx
    vy += dy * dy
  }
  return vx && vy ? covariance / Math.sqrt(vx * vy) : 0
}

/** Sum of squared deviations from the mean over values[from, to). */
export function sse(values: number[], from: number, to: number): number {
  const slice = values.slice(from, to)
  const m = mean(slice)
  return slice.reduce((total, value) => total + (value - m) ** 2, 0)
}
