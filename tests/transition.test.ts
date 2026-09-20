import { afterEach, describe, expect, it, vi } from 'vitest'
import { withTransition } from '@/utils/transition'

const doc = document as unknown as { startViewTransition?: unknown }

afterEach(() => {
  delete doc.startViewTransition
  vi.unstubAllGlobals()
})

describe('withTransition', () => {
  it('just runs the update when the browser has no view transitions', () => {
    const update = vi.fn()
    withTransition(update)
    expect(update).toHaveBeenCalledOnce()
  })

  it('runs the update inside a transition and swallows a skipped one', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const skipped = () => Promise.reject(new Error('Transition was skipped'))
    const update = vi.fn()
    doc.startViewTransition = (callback: () => void) => {
      callback()
      return { ready: skipped(), finished: skipped(), updateCallbackDone: skipped() }
    }
    withTransition(update)
    await Promise.resolve()
    expect(update).toHaveBeenCalledOnce()
  })

  it('skips the transition for readers who asked for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const start = vi.fn()
    doc.startViewTransition = start
    const update = vi.fn()
    withTransition(update)
    expect(update).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })
})
