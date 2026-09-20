import type { Chapter, MonthRow, Story } from '@/types'
import { formatMonth } from '@/utils/time'
import { formatNumber } from '@/utils/format'

const playsPerMonth = (chapter: Chapter, months: MonthRow[]): number => {
  const inside = months.filter((row) => row.key >= chapter.startKey && row.key < chapter.endKey)
  return inside.length ? inside.reduce((sum, row) => sum + row.plays, 0) / inside.length : 0
}

/** The pair of neighbouring chapters where the listening changes most, by plays per month. */
function biggestTurn(
  story: Story,
): { from: Chapter; to: Chapter; before: number; after: number } | null {
  let best: ReturnType<typeof biggestTurn> = null
  let bestChange = 0
  story.chapters.slice(1).forEach((to, index) => {
    const from = story.chapters[index]
    if (!from) return
    const before = playsPerMonth(from, story.months)
    const after = playsPerMonth(to, story.months)
    const change = Math.abs(after - before)
    if (change > bestChange) {
      bestChange = change
      best = { from, to, before, after }
    }
  })
  return best
}

const rate = (value: number): string =>
  value < 1 ? 'no plays' : `${formatNumber(Math.round(value))} plays a month`

/**
 * A few short paragraphs that say what the chapters add up to. Every sentence is built from what the story already
 * found, so nothing here is new data.
 */
export function epilogueOf(story: Story): string[] {
  if (story.chapters.length < 2) return []
  const names = story.chapters.map((chapter) => chapter.persona)
  const last = names.at(-1)
  const paragraphs = [
    `Read in order, the ${names.length} chapters are ${names.slice(0, -1).join(', ')} and ${last ?? ''}. Nobody stays one person for eleven years, and the receipts show the changes rather than a single average.`,
  ]
  const turn = biggestTurn(story)
  if (turn) {
    paragraphs.push(
      `The sharpest turn comes at ${formatMonth(turn.to.startKey)}, where ${turn.from.persona} gives way to ${turn.to.persona}: listening moves from ${rate(turn.before)} to ${rate(turn.after)}.`,
    )
  }
  const link = story.insights.find((insight) => insight.id === 'top-link')
  if (link) {
    paragraphs.push(
      `${link.headline}. That is a habit that shows in when things happened, not a reason, so treat it as a question to ask, not an answer.`,
    )
  }
  paragraphs.push(
    'Every finding lists the days it came from. Open them and decide what it all means.',
  )
  return paragraphs
}
