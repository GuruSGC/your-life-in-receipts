const WIDTH = 640
const PAD = 44
const ROW = 42

/** Draws the receipt onto a canvas: a title, one dotted row per line, and the total under a dashed rule. */
export function drawReceipt(
  context: CanvasRenderingContext2D,
  lines: [string, string][],
  total: string,
): void {
  const height = PAD * 2 + 130 + lines.length * ROW + 90
  context.canvas.width = WIDTH
  context.canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, WIDTH, height)
  context.fillStyle = '#13202f'
  context.font = '600 15px monospace'
  context.fillText('YOUR LIFE, IN RECEIPTS', PAD, PAD + 10)
  context.font = '700 30px sans-serif'
  context.fillText('One life, itemised', PAD, PAD + 56)
  context.font = '18px monospace'
  lines.forEach(([label, value], index) => {
    const y = PAD + 130 + index * ROW
    context.fillStyle = '#4a5b70'
    context.fillText(label, PAD, y)
    context.fillStyle = '#13202f'
    context.textAlign = 'right'
    context.fillText(value, WIDTH - PAD, y)
    context.textAlign = 'left'
    context.fillStyle = '#c9d7ea'
    context.fillRect(
      PAD + context.measureText(label).width + 12,
      y - 4,
      WIDTH - PAD * 2 - context.measureText(label).width - context.measureText(value).width - 24,
      2,
    )
  })
  const rule = PAD + 130 + lines.length * ROW
  context.fillStyle = '#9aa9c2'
  for (let x = PAD; x < WIDTH - PAD; x += 14) context.fillRect(x, rule - 12, 8, 3)
  context.fillStyle = '#13202f'
  context.font = '700 20px monospace'
  context.fillText('Receipts in total', PAD, rule + 28)
  context.textAlign = 'right'
  context.fillText(total, WIDTH - PAD, rule + 28)
  context.textAlign = 'left'
}

/** Saves the receipt as a PNG file. Returns false when the browser cannot draw it. */
export function saveReceiptImage(lines: [string, string][], total: string): boolean {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return false
  drawReceipt(context, lines, total)
  canvas.toBlob((blob) => {
    if (!blob) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'your-life-in-receipts.png'
    link.click()
    URL.revokeObjectURL(link.href)
  }, 'image/png')
  return true
}
