import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Receipt } from '@/types'
import { DrawerContext, type DrawerTarget } from './drawerApi'

/** Holds which day or receipt the drawer is showing and how to open and close it. */
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
