import { useEffect, type RefObject } from 'react'

let settled = false

/**
 * Moves focus to a page or chapter heading when it appears, so a route change is announced and keyboard users
 * start at the top of the new content. The very first render of the app is left alone.
 */
export function useFocusHeading(ref: RefObject<HTMLElement | null>, key: string): void {
  useEffect(() => {
    if (!settled) {
      settled = true
      return
    }
    ref.current?.focus({ preventScroll: true })
  }, [ref, key])
}

/** Test helper: treat the next render as the first one again. */
export function resetFocusHeading(): void {
  settled = false
}
