import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { withReceipts } from '@/features/data/services/decode'
import { loadStory } from '@/features/data/services/loadStory'
import type { LifeData, Receipt } from '@/features/data'
import type { Story } from '@/features/insights'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; life: LifeData; story: Story }

interface DataApi {
  state: State
  reload: () => void
}

const DataContext = createContext<DataApi | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    // The decoder and the insight engine run in a worker so the first paint and every interaction stay smooth.
    let early: Receipt[] | null = null
    loadStory((receipts) => {
      if (cancelled) return
      early = receipts
      setState((current) =>
        current.status === 'ready'
          ? { ...current, life: withReceipts(current.life, receipts) }
          : current,
      )
    })
      .then(({ life, story }) => {
        if (cancelled) return
        // The receipts can beat the story to the page when the work runs on the main thread.
        setState({ status: 'ready', life: early ? withReceipts(life, early) : life, story })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'The data could not be loaded.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])
  const value = useMemo(() => ({ state, reload }), [state, reload])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataApi {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}

/** Returns the loaded data, or null while it is loading or after it failed. */
// eslint-disable-next-line react-refresh/only-export-components
export function useReady(): { life: LifeData; story: Story } | null {
  const { state } = useData()
  return state.status === 'ready' ? { life: state.life, story: state.story } : null
}
