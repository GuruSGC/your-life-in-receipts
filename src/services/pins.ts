import { STORAGE_PINS_KEY } from '@/constants'
import { readJson, writeJson } from './storage'

const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/** The ids of the receipts pinned to the scrapbook, or none if nothing valid is stored. */
export function readPins(): string[] {
  return readJson(STORAGE_PINS_KEY, isIdList, [])
}

/** Saves the scrapbook. */
export function writePins(ids: string[]): void {
  writeJson(STORAGE_PINS_KEY, ids)
}
