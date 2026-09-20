import { createContext, useContext } from 'react'
import type { LifeData } from '@/types'
import type { Story } from '@/types'

export type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; life: LifeData; story: Story }

export interface DataApi {
  state: State
  reload: () => void
}

/** React context carrying the loaded data and a reload function. */
export const DataContext = createContext<DataApi | null>(null)

/** Returns the loaded data, or null while it is loading or after it failed. */
export function useReady(): { life: LifeData; story: Story } | null {
  const { state } = useData()
  return state.status === 'ready' ? { life: state.life, story: state.story } : null
}

/** Reads the data context; throws if used outside the provider. */
export function useData(): DataApi {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
