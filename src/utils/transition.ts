import { flushSync } from 'react-dom'

const ignore = (): void => undefined

/**
 * Runs a state change inside a cross-fade where the browser has the View Transitions API and the reader has not asked
 * for reduced motion; elsewhere it simply runs. A transition that is skipped because a newer one started is expected,
 * so its rejected promises are swallowed instead of surfacing as errors.
 */
export function withTransition(update: () => void): void {
  const start = document.startViewTransition?.bind(document)
  if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  const transition = start(() => flushSync(update))
  transition.ready.catch(ignore)
  transition.finished.catch(ignore)
  transition.updateCallbackDone.catch(ignore)
}
