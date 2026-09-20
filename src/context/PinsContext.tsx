import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Receipt } from '@/features/data'
import { readPins, writePins } from '@/services/pins'
import { PinsContext } from './pinsApi'

/** Keeps the scrapbook in memory and in browser storage. */
export function PinsProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set(readPins()))
  const toggle = useCallback((receipt: Receipt) => {
    setPinned((current) => {
      const next = new Set(current)
      if (next.has(receipt.id)) next.delete(receipt.id)
      else next.add(receipt.id)
      writePins([...next])
      return next
    })
  }, [])
  const value = useMemo(() => ({ pinned, toggle }), [pinned, toggle])
  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>
}
