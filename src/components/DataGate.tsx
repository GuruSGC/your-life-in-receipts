import type { ReactNode } from 'react'
import type { LifeData, Story } from '@/types'
import { useData } from '@/context/dataApi'

const SKELETON_WIDTHS = [70, 92, 55, 84, 62]

function LoadingReceipt() {
  return (
    <div role="status" aria-live="polite" className="ticket mx-auto max-w-md p-6">
      <p className="mono text-sm text-ink-2">Printing your receipts…</p>
      <div aria-hidden="true" className="mt-4 space-y-3">
        {SKELETON_WIDTHS.map((width) => (
          <div key={width} className="leader">
            <span className="h-3 rounded bg-line" style={{ width: `${width}%` }} />
            <span className="h-3 w-12 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Renders its children once the receipts have loaded, and a loading or retry state otherwise. */
export function DataGate({
  children,
}: {
  children: (data: { life: LifeData; story: Story }) => ReactNode
}) {
  const { state, reload } = useData()
  if (state.status === 'loading') return <LoadingReceipt />
  if (state.status === 'error') {
    return (
      <div role="alert" className="paper mx-auto max-w-lg p-6">
        <h2 className="text-xl">The receipts could not be loaded</h2>
        <p className="mt-2 text-ink-2">{state.message}</p>
        <button type="button" onClick={reload} className="btn btn-primary mt-4">
          Try again
        </button>
      </div>
    )
  }
  return <>{children({ life: state.life, story: state.story })}</>
}
