import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ArcDiagram } from '@/features/connections/components/ArcDiagram'
import { LinkDetail } from '@/features/connections/components/LinkDetail'
import { linkKey } from '@/features/connections/utils/linkKey'
import type { Receipt } from '@/features/data'
import { ExploreControls } from '@/features/explore/components/ExploreControls'
import { DEFAULT_FILTERS } from '@/features/explore/utils/search'
import type { Chapter, Insight, Link, MonthRow } from '@/features/insights'
import { Heatmap } from '@/features/rhythms/components/Heatmap'
import { ChapterBars } from '@/features/story/components/ChapterBars'
import { InsightCard } from '@/features/story/components/InsightCard'
import { JourneyStrip } from '@/features/story/components/JourneyStrip'
import { AppHeader } from '@/shared/components/AppHeader'
import { ReceiptRow } from '@/shared/components/ReceiptRow'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { DrawerProvider } from '@/shared/context/DrawerContext'

const receipt = (over: Partial<Receipt> = {}): Receipt => ({
  id: 'h-1',
  kind: 'ledger',
  min: Date.UTC(2017, 5, 1, 9, 30) / 60000,
  title: 'Lunch at the office',
  detail: 'Food › Lunch, paid by Cash',
  theme: 'food',
  amount: 250,
  direction: 'out',
  search: 'food lunch cash',
  ...over,
})

const link: Link = {
  artist: 'The Beatles',
  theme: 'food',
  window: 'diary',
  lift: 1.4,
  bothDays: 190,
  themeDays: 497,
  baseRate: 0.27,
  conditionalRate: 0.38,
  sampleDays: [17000, 17001],
}

const months: MonthRow[] = ['2017-01', '2017-02', '2017-03', '2017-04'].map((key, index) => ({
  key,
  startMin: Date.UTC(2017, index, 1) / 60000,
  minutes: 100 * (index + 1),
  plays: 30 * (index + 1),
  sessions: 5,
  nightPlays: 10,
  skips: 3,
  spendOut: index % 2 ? 4000 : 0,
  spendIn: 0,
  ledgerCount: index % 2 ? 12 : 0,
  cardCount: 0,
}))

const chapter: Chapter = {
  id: 'chapter-1',
  index: 1,
  startKey: '2017-01',
  endKey: '2017-04',
  startMin: Date.UTC(2017, 0, 1) / 60000,
  endMin: Date.UTC(2017, 4, 1) / 60000,
  persona: 'The Night Shift',
  title: 'Jan 2017 to Apr 2017',
  blurb: 'A blurb.',
  sources: ['music', 'ledger'],
  stats: {
    plays: 300,
    minutes: 1000,
    sessions: 20,
    nightShare: 0.4,
    skipRate: 0.1,
    leadArtist: 'The Beatles',
    leadShare: 0.3,
    spend: 8000,
    topTheme: 'food',
    topThemeShare: 0.5,
  },
  momentDay: null,
}

const insight: Insight = {
  id: 'x',
  group: 'rhythm',
  headline: 'The night is when the music happens',
  body: 'Body text.',
  stat: '38%',
  statLabel: 'of plays at night',
  evidenceDays: [17000, 17001, 17002, 17003, 17004],
}

describe('ReceiptRow', () => {
  it('prints the title, the rupee amount and the source, and marks flagged card receipts', () => {
    render(
      <ul>
        <ReceiptRow receipt={receipt({ kind: 'card', flagged: true })} showDate />
      </ul>,
    )
    expect(screen.getByText('Lunch at the office')).toBeInTheDocument()
    expect(screen.getByText(/₹250/)).toBeInTheDocument()
    expect(screen.getByText(/Card statement/)).toBeInTheDocument()
    expect(screen.getByText(/flagged by the bank/)).toBeInTheDocument()
    expect(screen.getByText(/1 Jun 2017/)).toBeInTheDocument()
  })

  it('does not print a false midnight for ledger entries without a time', () => {
    const midnight = Date.UTC(2017, 5, 1) / 60000
    render(
      <ul>
        <ReceiptRow receipt={receipt({ min: midnight })} />
      </ul>,
    )
    expect(screen.queryByText(/00:00/)).not.toBeInTheDocument()
    expect(screen.getByText(/time not recorded/)).toBeInTheDocument()
  })

  it('becomes a button when it can be opened, and says so when a receipt has no date', async () => {
    const open = vi.fn()
    render(
      <ul>
        <ReceiptRow receipt={receipt({ min: null })} onOpen={open} />
      </ul>,
    )
    expect(screen.getByText(/no date/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(open).toHaveBeenCalledTimes(1)
  })
})

describe('ThemeToggle and AppHeader', () => {
  it('flips the theme attribute', async () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /switch to the dark theme/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: /switch to the light theme/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('marks the current page in both navigations and offers every route', () => {
    render(<AppHeader current="story" />)
    const current = screen.getAllByRole('link', { current: 'page' })
    expect(current).toHaveLength(2)
    for (const label of ['Receipt', 'Story', 'Connections', 'Rhythms', 'Explore']) {
      expect(
        screen.getAllByRole('link', { name: new RegExp(label) }).length,
      ).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('ExploreControls', () => {
  it('reports every change and can be reset', async () => {
    const onChange = vi.fn()
    const onReset = vi.fn()
    render(
      <ExploreControls
        filters={DEFAULT_FILTERS}
        years={[2016, 2017]}
        onChange={onChange}
        onReset={onReset}
      />,
    )
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'a')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'a' }))
    await userEvent.click(screen.getByRole('button', { name: 'Music' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kinds: ['ledger', 'card'] }),
    )
    await userEvent.selectOptions(screen.getByLabelText(/^theme$/i), 'food')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'food' }))
    await userEvent.selectOptions(screen.getByLabelText(/from year/i), '2017')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ yearFrom: 2017 }))
    await userEvent.selectOptions(screen.getByLabelText(/order/i), 'largest')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'largest' }))
    await userEvent.click(screen.getByRole('button', { name: /include the drawer/i }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ includeUndated: false }))
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(onReset).toHaveBeenCalled()
  })

  it('limits how much can be typed into the search box', () => {
    render(
      <ExploreControls
        filters={DEFAULT_FILTERS}
        years={[2017]}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByRole('searchbox')).toHaveAttribute('maxlength', '80')
  })
})

describe('connections', () => {
  it('draws one curve per link and reports a click', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ArcDiagram
        links={[link, { ...link, artist: 'Radiohead', lift: 0.6 }]}
        selected={linkKey(link)}
        onSelect={onSelect}
      />,
    )
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(2)
    await userEvent.click(paths[1] as Element)
    expect(onSelect).toHaveBeenCalledWith(linkKey({ ...link, artist: 'Radiohead' }))
  })

  it('explains a link with its rates, its days and the caveat', () => {
    render(
      <DrawerProvider>
        <LinkDetail link={link} />
      </DrawerProvider>,
    )
    expect(screen.getByText(/1.4×/)).toBeInTheDocument()
    expect(screen.getByText(/more likely/)).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByText(/not a cause/i)).toBeInTheDocument()
  })
})

describe('charts', () => {
  it('draws the heatmap with a text alternative and a data table', () => {
    const hours = Array.from({ length: 168 }, (_, index) => (index % 24 === 21 ? 100 : 5))
    const { container } = render(<Heatmap hours={hours} />)
    expect(screen.getByRole('img', { name: /busiest cell is Mon at 21:00/i })).toBeInTheDocument()
    expect(container.querySelectorAll('svg rect[fill^="color-mix"]')).toHaveLength(168)
    expect(
      within(screen.getByRole('table', { hidden: true })).getAllByRole('row', { hidden: true }),
    ).toHaveLength(25)
  })

  it('draws the journey strip with a link per chapter and bars for months with listening', () => {
    const { container } = render(<JourneyStrip months={months} chapters={[chapter]} active={1} />)
    expect(screen.getByRole('link', { name: /Chapter 1: The Night Shift/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(container.querySelectorAll('rect.bar-grow')).toHaveLength(4)
  })

  it('draws a chapter chart with spending when a ledger covers it, and says so when none does', () => {
    const { rerender } = render(<ChapterBars chapter={chapter} months={months} />)
    expect(screen.getByRole('img', { name: /monthly spending up to/i })).toBeInTheDocument()
    rerender(
      <ChapterBars chapter={chapter} months={months.map((row) => ({ ...row, spendOut: 0 }))} />,
    )
    expect(screen.getByText(/No spending receipts cover this chapter/)).toBeInTheDocument()
  })
})

describe('InsightCard', () => {
  it('shows the finding and at most four of the days it came from', () => {
    render(
      <DrawerProvider>
        <InsightCard insight={insight} />
      </DrawerProvider>,
    )
    expect(screen.getByText('38%')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: /the night is when/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })
})
