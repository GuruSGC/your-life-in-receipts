import { DownloadSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import type { LifeData } from '@/types'
import { receiptTotal, totalsLines } from '@/utils/receipt'
import { saveReceiptImage } from '@/utils/receiptImage'

/** Saves the one-life receipt as a picture, and says when the browser could not draw it. */
export function SaveReceiptButton({ life }: { life: LifeData }) {
  const [failed, setFailed] = useState(false)
  const save = (): void => setFailed(!saveReceiptImage(totalsLines(life), receiptTotal(life)))
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={save}>
        <DownloadSimple size={18} weight="bold" aria-hidden={true} /> Save as an image
      </button>
      {failed ? (
        <p role="status" className="text-sm text-ink-2">
          This browser could not draw the receipt.
        </p>
      ) : null}
    </>
  )
}
