import { Shuffle } from '@phosphor-icons/react'
import { useDrawer } from '@/context/drawerApi'
import { useReady } from '@/context/dataApi'
import { pickSurpriseDay } from '../utils/surprise'

/** Opens a random day where the music and the money met, for readers who want to start somewhere unplanned. */
export function SurpriseButton() {
  const ready = useReady()
  const { openDay } = useDrawer()
  const complete = ready?.life.complete === true
  const surprise = (): void => {
    if (!ready) return
    const day = pickSurpriseDay(ready.life)
    if (day !== null) openDay(day)
  }
  return (
    <button type="button" className="btn btn-ghost" disabled={!complete} onClick={surprise}>
      <Shuffle size={18} weight="bold" aria-hidden={true} /> Surprise me
    </button>
  )
}
