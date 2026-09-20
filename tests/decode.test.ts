import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assemble, decodeCard, decodeLedger, decodeMusic } from '@/services/data'
import { loadLifeData } from '@/services/data/dataService'

const read = (name: string): unknown => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'))

describe('compiled data decoding', () => {
  const life = assemble(
    decodeMusic(read('music')),
    decodeLedger(read('ledger')),
    decodeCard(read('card')),
  )

  it('turns every compiled row into a receipt', () => {
    expect(life.totals.sessions).toBeGreaterThan(8000)
    expect(life.receipts.length).toBe(life.totals.sessions + life.totals.spendReceipts)
    expect(life.receipts.every((receipt) => receipt.title.length > 0)).toBe(true)
  })

  it('keeps undated card receipts out of the day index but inside the receipt list', () => {
    const undated = life.receipts.filter((receipt) => receipt.min === null)
    expect(undated.length).toBe(102)
    const indexed = [...life.byDay.values()].reduce((sum, list) => sum + list.length, 0)
    expect(indexed).toBe(life.receipts.length - undated.length)
  })

  it('reports the cleaning it did', () => {
    const card = life.quality.find((source) => source.label === 'Card statement')
    expect(card?.notes.join(' ')).toMatch(/distinct transactions/)
    expect(life.quality).toHaveLength(3)
  })

  it('decodes session start times from deltas in ascending order', () => {
    const listens = life.receipts.filter((receipt) => receipt.kind === 'listen')
    for (let i = 1; i < listens.length; i += 1)
      expect((listens[i]?.min ?? 0) >= (listens[i - 1]?.min ?? 0)).toBe(true)
  })

  it('rejects malformed files with a readable error', () => {
    expect(() => decodeMusic({ stats: {} })).toThrow(/missing|not/)
    expect(() =>
      decodeLedger({ stats: { rows: 1 }, cats: [], subs: [], modes: [], rows: [[1, 2]] }),
    ).toThrow(/short row/)
    expect(() => decodeCard('nope')).toThrow(/not an object/)
  })

  it('surfaces a failed download', async () => {
    await expect(
      loadLifeData(() =>
        Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) }),
      ),
    ).rejects.toThrow(/HTTP 404/)
  })
})
