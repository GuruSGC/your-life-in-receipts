// Small RFC 4180 CSV reader (quoted fields, escaped quotes, CRLF, BOM). Shared by the data build and the verifiers.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^﻿/, '')
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"'
          i += 1
        } else quoted = false
      } else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

export function readCsvRecords(path) {
  const [header = [], ...body] = parseCsv(readFileSync(path, 'utf8'))
  const keys = header.map((name) => name.trim())
  const records = []
  let malformed = 0
  for (const row of body) {
    if (row.length === 1 && row[0] === '') continue
    if (row.length !== keys.length) {
      malformed += 1
      continue
    }
    records.push(Object.fromEntries(keys.map((key, index) => [key, row[index]])))
  }
  return { records, malformed }
}

export const DATA_DIR =
  process.env.LIFE_DATA_DIR ?? fileURLToPath(new URL('../../../life-data/', import.meta.url))
