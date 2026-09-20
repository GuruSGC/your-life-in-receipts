import { createContext, useContext } from 'react'
import type { Receipt } from '@/types'

export interface PinsApi {
  pinned: ReadonlySet<string>
  toggle: (receipt: Receipt) => void
}

export const PinsContext = createContext<PinsApi | null>(null)

/** The scrapbook: which receipts are pinned and a function to pin or unpin one. */
export function usePins(): PinsApi {
  const value = useContext(PinsContext)
  if (!value) throw new Error('usePins must be used inside PinsProvider')
  return value
}
