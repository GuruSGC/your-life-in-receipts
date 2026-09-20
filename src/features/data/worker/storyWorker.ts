/// <reference lib="webworker" />
import { buildStory, forInterface } from '@/features/insights'
import { loadLifeData } from '../services/dataService'
import { withoutReceipts } from '../services/decode'

const CHUNK = 1500

/**
 * Decodes the data files and runs the insight engine off the main thread. The story and totals go first so the page
 * can paint; the receipts follow in small chunks so no single message keeps the page busy.
 */
self.onmessage = async (): Promise<void> => {
  try {
    const life = await loadLifeData()
    self.postMessage({
      type: 'story',
      life: withoutReceipts(life),
      story: forInterface(buildStory(life)),
    })
    for (let start = 0; start < life.receipts.length; start += CHUNK) {
      self.postMessage({ type: 'chunk', receipts: life.receipts.slice(start, start + CHUNK) })
    }
    self.postMessage({ type: 'done' })
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'The data could not be loaded.',
    })
  }
}
