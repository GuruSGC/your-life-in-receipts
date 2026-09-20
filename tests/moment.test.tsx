import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Receipt } from '@/features/data'
import { MomentChain } from '@/features/story/components/MomentChain'
import { chainOf } from '@/features/story/utils/moment'

const make = (
  id: string,
  kind: Receipt['kind'],
  min: number,
  over: Partial<Receipt> = {},
): Receipt => ({
  id,
  kind,
  min,
  title: id,
  detail: '',
  theme: 'other',
  search: id,
  ...over,
})

const day: Receipt[] = [
  make('m2', 'listen', 200, { listenMinutes: 30 }),
  make('m1', 'listen', 100, { listenMinutes: 60 }),
  make('p1', 'ledger', 300, { amount: 250, direction: 'out' }),
  make('p2', 'ledger', 310, { amount: 50, direction: 'in' }),
  make('m3', 'listen', 400, { listenMinutes: 15 }),
]

describe('the chain of a day', () => {
  it('merges neighbours of the same kind, in time order, summing minutes and money out', () => {
    const chain = chainOf(day)
    expect(chain.map((link) => [link.kind, link.count, link.amount])).toEqual([
      ['listen', 2, 90],
      ['ledger', 2, 250],
      ['listen', 1, 15],
    ])
    expect(chain[0]?.lead).toBe('m1')
  })

  it('renders nothing for a day with one kind of receipt and a readable list otherwise', () => {
    const { container, rerender } = render(<MomentChain receipts={[day[0] as Receipt]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<MomentChain receipts={day} />)
    expect(screen.getByRole('list', { name: /how the day unfolded/i })).toBeInTheDocument()
    expect(screen.getByText(/Music ×2/)).toBeInTheDocument()
    expect(screen.getByText(/₹250/)).toBeInTheDocument()
  })
})
