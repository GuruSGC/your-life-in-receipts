import { createContext, useContext } from 'react'
import type { Receipt } from '@/types'

export type DrawerTarget =
  { kind: 'day'; day: number } | { kind: 'receipt'; receipt: Receipt } | null

export interface DrawerApi {
  target: DrawerTarget
  openDay: (day: number) => void
  openReceipt: (receipt: Receipt) => void
  close: () => void
}

/** React context carrying the day drawer state. */
export const DrawerContext = createContext<DrawerApi | null>(null)

/** Reads the drawer context; throws if used outside the provider. */
export function useDrawer(): DrawerApi {
  const value = useContext(DrawerContext)
  if (!value) throw new Error('useDrawer must be used inside DrawerProvider')
  return value
}
