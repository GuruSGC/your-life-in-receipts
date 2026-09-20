import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Receipt } from '@/features/data'

export type DrawerTarget =
  { kind: 'day'; day: number } | { kind: 'receipt'; receipt: Receipt } | null

interface DrawerApi {
  target: DrawerTarget
  openDay: (day: number) => void
  openReceipt: (receipt: Receipt) => void
  close: () => void
}

const DrawerContext = createContext<DrawerApi | null>(null)

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<DrawerTarget>(null)
  const openDay = useCallback((day: number) => setTarget({ kind: 'day', day }), [])
  const openReceipt = useCallback((receipt: Receipt) => setTarget({ kind: 'receipt', receipt }), [])
  const close = useCallback(() => setTarget(null), [])
  const value = useMemo(
    () => ({ target, openDay, openReceipt, close }),
    [target, openDay, openReceipt, close],
  )
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDrawer(): DrawerApi {
  const value = useContext(DrawerContext)
  if (!value) throw new Error('useDrawer must be used inside DrawerProvider')
  return value
}
