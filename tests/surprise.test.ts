import { describe, expect, it } from 'vitest'
import type { LifeData, Receipt } from '@/types'
import { pickSurpriseDay } from '@/features/story/utils/surprise'

const receipt = (id: string, kind: Receipt['kind']): Receipt => ({
  id,
  kind,
  min: 0,
  title: id,
  detail: '',
  theme: 'other',
  search: id,
})

const lifeWith = (byDay: [number, Receipt[]][]): LifeData =>
  ({ byDay: new Map(byDay) }) as unknown as LifeData

describe('pickSurpriseDay', () => {
  it('only offers days that combine at least two kinds of receipt', () => {
    const life = lifeWith([
      [1, [receipt('a', 'listen'), receipt('b', 'listen')]],
      [2, [receipt('c', 'listen'), receipt('d', 'ledger')]],
      [3, [receipt('e', 'card')]],
    ])
    for (const r of [0, 0.3, 0.99]) expect(pickSurpriseDay(life, () => r)).toBe(2)
  })

  it('returns null when nothing qualifies and stays in range at the top of the random scale', () => {
    expect(pickSurpriseDay(lifeWith([[1, [receipt('a', 'listen')]]]))).toBeNull()
    const many = lifeWith([
      [1, [receipt('a', 'listen'), receipt('b', 'card')]],
      [2, [receipt('c', 'listen'), receipt('d', 'ledger')]],
    ])
    expect(pickSurpriseDay(many, () => 0.9999)).toBe(2)
  })
})
