import { useEffect, useState } from 'react'

/**
 * Calls `onTick` every `intervalMs` while playing. `onTick` returns false when there is nothing left to
 * play, which stops playback.
 */
export function useAutoplay(
  onTick: () => boolean,
  intervalMs: number,
): { playing: boolean; toggle: () => void } {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setInterval(() => {
      if (!onTick()) setPlaying(false)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [playing, onTick, intervalMs])
  return { playing, toggle: () => setPlaying((value) => !value) }
}
