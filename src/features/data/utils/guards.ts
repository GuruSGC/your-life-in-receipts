export type Json = Record<string, unknown>

export const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
export const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

export function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Data file is missing ${what}`)
  return value
}

export function recordOf(value: unknown, what: string): Json {
  if (!isRecord(value)) throw new Error(`Data file section "${what}" is not an object`)
  return value
}

export function rowsOf(value: unknown, what: string, width: number): unknown[][] {
  if (!Array.isArray(value)) throw new Error(`Data file section "${what}" is not a list`)
  for (const row of value) {
    if (!Array.isArray(row) || row.length < width)
      throw new Error(`Data file section "${what}" has a short row`)
  }
  return value as unknown[][]
}
