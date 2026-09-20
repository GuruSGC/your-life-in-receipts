import { readFileSync } from 'node:fs'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/app/App'

const files = new Map<string, unknown>()
const fileFor = (path: string): unknown => {
  if (!files.has(path)) files.set(path, JSON.parse(readFileSync(`public${path}`, 'utf8')))
  return files.get(path)
}

function stubFetch(fail = false): void {
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve({
      ok: !fail,
      status: fail ? 500 : 200,
      json: () => Promise.resolve(fail ? null : fileFor(input)),
    }),
  )
}

beforeAll(() => {
  // jsdom does not implement the modal dialog methods.
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  stubFetch()
  window.location.hash = '#/'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the app', () => {
  it('loads the receipts and shows the headline numbers on the home page', async () => {
    render(<App />)
    expect(
      await screen.findByRole('heading', { level: 1, name: /told in receipts/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/148,350 songs and 3,761 purchases/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /journey in 7 chapters/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Chapter \d/ }).length).toBeGreaterThanOrEqual(7)
  })

  it('offers a way past a failed download', async () => {
    stubFetch(true)
    render(<App />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not be loaded/i)
    stubFetch()
    await userEvent.click(within(alert).getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(/148,350 songs and 3,761 purchases/)).toBeInTheDocument()
  })

  it('switches theme and remembers it', async () => {
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    const toggle = screen.getByRole('button', { name: /switch to the (dark|light) theme/i })
    const before = document.documentElement.dataset.theme
    await userEvent.click(toggle)
    expect(document.documentElement.dataset.theme).not.toBe(before)
    expect(localStorage.getItem('life-receipts:theme:v1')).toContain(
      document.documentElement.dataset.theme ?? '',
    )
  })

  it('steps through every chapter of the story with the buttons', async () => {
    window.location.hash = '#/story'
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: /Explorer/ })).toBeInTheDocument()
    for (let chapter = 2; chapter <= 7; chapter += 1) {
      await userEvent.click(screen.getByRole('button', { name: /next chapter/i }))
      await waitFor(() =>
        expect(screen.getByText(new RegExp(`Chapter ${chapter} of 7`))).toBeInTheDocument(),
      )
    }
    expect(screen.getByRole('button', { name: /next chapter/i })).toBeDisabled()
    expect(screen.getByRole('progressbar', { name: /story progress/i })).toHaveAttribute(
      'aria-valuenow',
      '7',
    )
  })

  it('searches and filters the receipts, and opens a day', async () => {
    window.location.hash = '#/explore'
    render(<App />)
    expect(await screen.findByText(/12,611 receipts/)).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'kirana')
    await waitFor(() => expect(screen.getByRole('status')).not.toHaveTextContent(/12,611 receipts/))
    const shown = (screen.getByRole('status').textContent ?? '').split(' receipts')[0] ?? ''
    const count = Number(shown.replaceAll(',', ''))
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(500)
    await userEvent.click(screen.getByRole('button', { name: 'Music' }))
    await userEvent.click(screen.getAllByRole('button', { name: /kirana/i })[0] as HTMLElement)
    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(dialog).toHaveAttribute('open')
    expect(within(dialog).getByRole('heading', { level: 2 })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: /close/i }))
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/12,611 receipts/))
  })

  it('reports an empty search honestly', async () => {
    window.location.hash = '#/explore'
    render(<App />)
    await screen.findByText(/12,611 receipts/)
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'zzzzqqqq')
    expect(await screen.findByText(/nothing matches/i)).toBeInTheDocument()
  })

  it('shows a connection and the days behind it', async () => {
    window.location.hash = '#/connections'
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    const buttons = await screen.findAllByRole('button', { name: /shared days/i })
    await userEvent.click(buttons[1] as HTMLElement)
    expect(screen.getByRole('button', { name: /shared days/i, pressed: true })).toBeInTheDocument()
    expect(screen.getByText(/not a cause/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /card years/i }))
  })

  it('lets you read any month on the rhythms page', async () => {
    window.location.hash = '#/rhythms'
    render(<App />)
    const slider = await screen.findByRole('slider')
    await act(async () => {
      slider.focus()
    })
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByText(/^Month, /)).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: /the beatles/i })[0] as HTMLElement)
  })

  it('explains its method and the cleaning it did', async () => {
    window.location.hash = '#/method'
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: /what the data looked like/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/distinct transactions/i)).toBeInTheDocument()
  })

  it('opens the receipts behind an insight from the home page', async () => {
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    const chip = (await screen.findAllByRole('button', { name: /\d{4}$/ }))[0] as HTMLElement
    await userEvent.click(chip)
    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(within(dialog).getByRole('button', { name: /earlier day/i })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: /later day/i }))
    expect(within(dialog).getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
