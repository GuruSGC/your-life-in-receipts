export type Json = Record<string, unknown>

/** Narrows an unknown value to a plain object. */
export const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
/** Narrows an unknown value to an array of strings. */
export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
/** Narrows an unknown value to an array of numbers. */
export const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

/** Returns a value or throws a readable error naming what is missing. */
export function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Data file is missing ${what}`)
  return value
}

/** Returns a value as an object or throws a readable error. */
export function recordOf(value: unknown, what: string): Json {
  if (!isRecord(value)) throw new Error(`Data file section "${what}" is not an object`)
  return value
}

/** Returns a list of rows, checking each is long enough, or throws a readable error. */
export function rowsOf(value: unknown, what: string, width: number): unknown[][] {
  if (!Array.isArray(value)) throw new Error(`Data file section "${what}" is not a list`)
  for (const row of value) {
    if (!Array.isArray(row) || row.length < width)
      throw new Error(`Data file section "${what}" has a short row`)
  }
  return value as unknown[][]
}
