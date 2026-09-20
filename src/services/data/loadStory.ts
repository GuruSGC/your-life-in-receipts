import type { Story } from '@/types'
import type { LifeData, Receipt } from '@/types'
import { withoutReceipts } from './decode'

export interface Loaded {
  life: LifeData
  story: Story
}

type WorkerReply =
  | { type: 'story'; life: LifeData; story: Story }
  | { type: 'chunk'; receipts: Receipt[] }
  | { type: 'done' }
  | { type: 'error'; message: string }

/** The same work on the main thread, for browsers without module workers and for tests. */
async function loadDirect(): Promise<Loaded> {
  const [data, insights] = await Promise.all([
    import('@/services/data'),
    import('@/services/insights'),
  ])
  const life = await data.loadLifeData()
  return { life, story: insights.forInterface(insights.buildStory(life)) }
}

/**
 * Loads the receipts and builds the story, in a worker when one is available. The promise resolves with the story and
 * totals as soon as they exist; `onReceipts` is called with every receipt once the rest has arrived.
 */
export function loadStory(onReceipts: (receipts: Receipt[]) => void): Promise<Loaded> {
  if (typeof Worker === 'undefined') {
    return loadDirect().then((loaded) => {
      onReceipts(loaded.life.receipts)
      return { life: withoutReceipts(loaded.life), story: loaded.story }
    })
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../worker/storyWorker.ts', import.meta.url), {
      type: 'module',
    })
    const received: Receipt[] = []
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const message = event.data
      if (message.type === 'story') resolve({ life: message.life, story: message.story })
      else if (message.type === 'chunk') received.push(...message.receipts)
      else if (message.type === 'done') {
        worker.terminate()
        onReceipts(received)
      } else {
        worker.terminate()
        reject(new Error(message.message))
      }
    }
    worker.onerror = () => {
      worker.terminate()
      loadDirect().then((loaded) => {
        resolve({ life: withoutReceipts(loaded.life), story: loaded.story })
        onReceipts(loaded.life.receipts)
      }, reject)
    }
    worker.postMessage(null)
  })
}
