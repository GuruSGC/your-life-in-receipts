import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Epilogue } from '@/features/story/components/Epilogue'
import { SaveReceiptButton } from '@/features/story/components/SaveReceiptButton'
import { redirectPathToHash } from '@/hooks/useHashRoute'
import { epilogueOf } from '@/services/insights/epilogue'
import type { Chapter, LifeData, MonthRow, Story } from '@/types'
import { receiptTotal, totalsLines } from '@/utils/receipt'
import { drawReceipt } from '@/utils/receiptImage'

const month = (key: string, plays: number): MonthRow => ({
  key,
  startMin: 0,
  minutes: plays * 3,
  plays,
  sessions: 1,
  nightPlays: 0,
  skips: 0,
  spendOut: 0,
  spendIn: 0,
  ledgerCount: 0,
  cardCount: 0,
})

const chapter = (index: number, persona: string, startKey: string, endKey: string): Chapter => ({
  id: `chapter-${index}`,
  index,
  startKey,
  endKey,
  startMin: 0,
  endMin: 1,
  persona,
  title: '',
  blurb: '',
  sources: ['music'],
  stats: {
    plays: 0,
    minutes: 0,
    sessions: 0,
    nightShare: 0,
    skipRate: 0,
    leadArtist: '',
    leadShare: 0,
    spend: 0,
    topTheme: null,
    topThemeShare: 0,
  },
  momentDay: null,
})

const story: Story = {
  months: [month('2016-01', 100), month('2016-02', 100), month('2016-03', 0), month('2016-04', 0)],
  chapters: [
    chapter(1, 'The Explorer', '2016-01', '2016-03'),
    chapter(2, 'The Silence', '2016-03', '2016-05'),
  ],
  insights: [
    {
      id: 'top-link',
      group: 'link',
      headline: 'The Beatles shows up on food days',
      body: '',
      stat: '1.4x',
      statLabel: '',
      evidenceDays: [],
    },
  ],
  links: [],
}

const life = {
  range: { startMin: 0, endMin: 1440 },
  totals: {
    plays: 10,
    listenedMinutes: 90,
    artists: 3,
    sessions: 4,
    ledgerReceipts: 5,
    cardReceipts: 6,
    undated: 1,
    spendReceipts: 11,
  },
} as unknown as LifeData

describe('epilogueOf', () => {
  it('names the chapters, the sharpest turn and the strongest link', () => {
    const text = epilogueOf(story)
    expect(text[0]).toContain('The Explorer and The Silence')
    expect(text[1]).toContain('gives way to The Silence')
    expect(text[1]).toContain('no plays')
    expect(text.join(' ')).toContain('The Beatles shows up on food days')
    expect(text.at(-1)).toMatch(/decide what it all means/)
  })

  it('says nothing when there is only one chapter', () => {
    expect(epilogueOf({ ...story, chapters: story.chapters.slice(0, 1) })).toEqual([])
    const { container } = render(<Epilogue story={{ ...story, chapters: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders as a labelled section', () => {
    render(<Epilogue story={story} />)
    expect(screen.getByRole('heading', { name: /what it all means/i })).toBeInTheDocument()
  })
})

describe('the receipt image', () => {
  it('lists the receipt rows and the total', () => {
    expect(totalsLines(life)).toHaveLength(9)
    expect(receiptTotal(life)).toBe('15')
  })

  it('draws every row onto the canvas', () => {
    const texts: string[] = []
    const canvas = { width: 0, height: 0 }
    const context = {
      canvas,
      fillRect: vi.fn(),
      fillText: (text: string) => texts.push(text),
      measureText: () => ({ width: 50 }),
    } as unknown as CanvasRenderingContext2D
    drawReceipt(context, totalsLines(life), '15')
    expect(canvas.width).toBe(640)
    expect(texts).toContain('Songs played')
    expect(texts).toContain('Receipts in total')
  })

  it('says so when the browser cannot draw', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<SaveReceiptButton life={life} />)
    await userEvent.click(screen.getByRole('button', { name: /save as an image/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/could not draw/i)
    vi.restoreAllMocks()
  })
})

describe('redirectPathToHash', () => {
  const at = (pathname: string, hash = '', search = ''): Location =>
    ({ pathname, hash, search }) as Location

  it('moves a plain path into the hash and keeps the query', () => {
    const replace = vi.spyOn(window.history, 'replaceState').mockImplementation(() => undefined)
    redirectPathToHash(at('/story', '', '?chapter=3'))
    expect(replace).toHaveBeenCalledWith(null, '', '/#/story?chapter=3')
    replace.mockClear()
    redirectPathToHash(at('/'))
    redirectPathToHash(at('/nowhere'))
    redirectPathToHash(at('/story', '#/explore'))
    expect(replace).not.toHaveBeenCalled()
    replace.mockRestore()
  })
})
