import { readFileSync } from 'node:fs'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/app/App'

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
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the scrapbook', () => {
  it('pins receipts, keeps them across a reload, and can show only the pinned ones', async () => {
    window.location.hash = '#/explore'
    const first = render(<App />)
    await screen.findByText(/12,611 receipts/)
    await userEvent.type(screen.getByRole('searchbox'), 'kirana')
    // The search is deferred: wait until the list has really narrowed before pinning from it.
    await waitFor(() => expect(screen.queryByText(/12,611 receipts/)).not.toBeInTheDocument())
    const pins = await screen.findAllByRole('button', { name: /pin to the scrapbook/i })
    await userEvent.click(pins[0] as HTMLElement)
    await userEvent.click(pins[1] as HTMLElement)
    expect(screen.getAllByRole('button', { name: /remove from the scrapbook/i })).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem('life-receipts:pins:v1') ?? '[]')).toHaveLength(2)
    first.unmount()
    window.location.hash = '#/explore'

    render(<App />)
    await screen.findByText(/12,611 receipts/)
    await userEvent.click(screen.getByRole('button', { name: /scrapbook only \(2\)/i }))
    await waitFor(() => expect(screen.getByText(/^2 receipts/)).toBeInTheDocument())
  })

  it('ignores a corrupted scrapbook in storage', async () => {
    localStorage.setItem('life-receipts:pins:v1', '{not json')
    window.location.hash = '#/explore'
    render(<App />)
    expect(await screen.findByRole('button', { name: /scrapbook only \(0\)/i })).toBeInTheDocument()
  })
})

describe('discovery and the guided story', () => {
  it('opens a day that combines sources when you ask to be surprised', async () => {
    window.location.hash = '#/'
    render(<App />)
    const button = await screen.findByRole('button', { name: /surprise me/i })
    await waitFor(() => expect(button).toBeEnabled())
    await userEvent.click(button)
    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(dialog).toHaveAttribute('open')
  })

  it('plays the story forward on a timer and stops at the last chapter', async () => {
    window.location.hash = '#/story?chapter=6'
    render(<App />)
    await screen.findByRole('heading', {
      level: 1,
      name: /Night Shift|Explorer|Loyalist|Soundtrack|Steady|Silence|Restless|Long/,
    })
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /play the story/i }))
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9100)
    })
    expect(screen.getByText(/Chapter 7 of 7/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play the story/i })).toBeInTheDocument()
  })
})
