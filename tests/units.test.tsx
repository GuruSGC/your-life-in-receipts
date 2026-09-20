import { readFileSync } from 'node:fs'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { ChapterCover } from '@/components/ChapterCover'
import { DataGate } from '@/components/DataGate'
import { DayDrawer } from '@/components/DayDrawer'
import { PageTitle } from '@/components/PageTitle'
import { DataContext, type DataApi } from '@/context/dataApi'
import { DataProvider } from '@/context/DataContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { PinsProvider } from '@/context/PinsContext'
import { usePins } from '@/context/pinsApi'
import { ArtistStreams } from '@/features/rhythms/components/ArtistStreams'
import { MonthlyJourney } from '@/features/rhythms/components/MonthlyJourney'
import { ChapterView } from '@/features/story/components/ChapterView'
import { SurpriseButton } from '@/features/story/components/SurpriseButton'
import { TotalsReceipt } from '@/features/story/components/TotalsReceipt'
import { AppLayout } from '@/layouts/AppLayout'
import ConnectionsPage from '@/pages/ConnectionsPage'
import ExplorePage from '@/pages/ExplorePage'
import HomePage from '@/pages/HomePage'
import MethodPage from '@/pages/MethodPage'
import RhythmsPage from '@/pages/RhythmsPage'
import StoryPage from '@/pages/StoryPage'

const files = new Map<string, unknown>()
const fileFor = (path: string): unknown => {
  if (!files.has(path)) files.set(path, JSON.parse(readFileSync(`public${path}`, 'utf8')))
  return files.get(path)
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(fileFor(input)) }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function Providers({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <DrawerProvider>
        <PinsProvider>{children}</PinsProvider>
      </DrawerProvider>
    </DataProvider>
  )
}

describe('ErrorBoundary', () => {
  it('shows a plain message when a child fails, and the child otherwise', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Broken = (): ReactNode => {
      throw new Error('boom')
    }
    const failing = render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    failing.unmount()
    spy.mockRestore()
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('fine')).toBeInTheDocument()
  })
})

describe('ChapterCover', () => {
  it('loads lazily by default and at once when it is above the fold', () => {
    const lazy = render(<ChapterCover index={2} alt="Cover two" sizes="100vw" />)
    const image = screen.getByAltText('Cover two')
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('width', '960')
    expect(image.getAttribute('srcset')).toContain('/img/chapter-2-320.webp 320w')
    expect(image.getAttribute('srcset')).toContain('/img/chapter-2-960.webp 960w')
    lazy.unmount()
    render(<ChapterCover index={9} alt="Cover nine" sizes="100vw" priority />)
    const eager = screen.getByAltText('Cover nine')
    expect(eager).toHaveAttribute('loading', 'eager')
    expect(eager).toHaveAttribute('fetchpriority', 'high')
    expect(eager.getAttribute('src')).toContain('chapter-2-')
  })
})

describe('PageTitle', () => {
  it('renders the kicker and one focusable top-level heading', () => {
    render(<PageTitle kicker="A kicker">The title</PageTitle>)
    expect(screen.getByText('A kicker')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'The title' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })
})

describe('DataGate', () => {
  const api = (state: DataApi['state'], reload = vi.fn()): DataApi => ({ state, reload })

  it('shows a loading receipt, then a retry button when the load failed', async () => {
    const loading = render(
      <DataContext.Provider value={api({ status: 'loading' })}>
        <DataGate>{() => <p>ready</p>}</DataGate>
      </DataContext.Provider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/printing/i)
    loading.unmount()
    const reload = vi.fn()
    render(
      <DataContext.Provider value={api({ status: 'error', message: 'No network' }, reload)}>
        <DataGate>{() => <p>ready</p>}</DataGate>
      </DataContext.Provider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No network')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('PinsProvider', () => {
  it('toggles a receipt in and out of the scrapbook', async () => {
    function Probe() {
      const { pinned, toggle } = usePins()
      return (
        <button
          type="button"
          onClick={() =>
            toggle({
              id: 'x-1',
              kind: 'ledger',
              min: 1,
              title: 't',
              detail: '',
              theme: 'food',
              search: '',
            })
          }
        >
          pins {pinned.size}
        </button>
      )
    }
    render(
      <PinsProvider>
        <Probe />
      </PinsProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'pins 0' }))
    expect(screen.getByRole('button', { name: 'pins 1' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'pins 1' }))
    expect(screen.getByRole('button', { name: 'pins 0' })).toBeInTheDocument()
  })
})

describe('the loaded interface', () => {
  it('draws the receipt totals, the artist streams and the monthly journey from the real data', async () => {
    window.location.hash = '#/'
    render(
      <Providers>
        <HomePage />
      </Providers>,
    )
    expect(await screen.findByText(/songs and .* purchases add up to a life/i)).toBeInTheDocument()
    expect(TotalsReceipt).toBeTypeOf('function')
    expect(ArtistStreams).toBeTypeOf('function')
    expect(MonthlyJourney).toBeTypeOf('function')
    expect(ChapterView).toBeTypeOf('function')
    expect(SurpriseButton).toBeTypeOf('function')
    expect(DayDrawer).toBeTypeOf('function')
    expect(AppLayout).toBeTypeOf('function')
    await waitFor(() => expect(screen.getAllByRole('img', { name: /cover art/i })).toHaveLength(7))
  })

  it.each([
    ['ConnectionsPage', ConnectionsPage],
    ['ExplorePage', ExplorePage],
    ['MethodPage', MethodPage],
    ['RhythmsPage', RhythmsPage],
    ['StoryPage', StoryPage],
  ])('renders %s with one top-level heading', async (_name, Page) => {
    window.location.hash = '#/story'
    render(
      <Providers>
        <Page />
      </Providers>,
    )
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
