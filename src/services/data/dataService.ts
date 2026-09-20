import { DATA_BASE_PATH } from '@/constants'
import type { LifeData } from '@/types'
import { assemble, decodeCard, decodeLedger, decodeMusic } from './decode'

type Fetcher = (input: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

async function fetchJson(fetcher: Fetcher, name: string): Promise<unknown> {
  const response = await fetcher(`${DATA_BASE_PATH}/${name}.json`)
  if (!response.ok) throw new Error(`Could not load ${name}.json (HTTP ${response.status})`)
  return response.json()
}

/** Loads and decodes the three compiled data files. Any malformed file rejects with a readable error. */
export async function loadLifeData(fetcher: Fetcher = (input) => fetch(input)): Promise<LifeData> {
  const [music, ledger, card] = await Promise.all([
    fetchJson(fetcher, 'music'),
    fetchJson(fetcher, 'ledger'),
    fetchJson(fetcher, 'card'),
  ])
  return assemble(decodeMusic(music), decodeLedger(ledger), decodeCard(card))
}
