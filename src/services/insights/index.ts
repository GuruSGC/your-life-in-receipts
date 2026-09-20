import type { Insight, LifeData, Story, StoryWithFacts } from '@/types'
import { buildChapters } from './chapters'
import {
  comfortLoop,
  explorerToLoyalist,
  nightOwl,
  peakYear,
  restlessYear,
  streaks,
} from './habits'
import { findLinks } from './links'
import {
  cardPlaces,
  dataHonesty,
  listeningAndSpending,
  spendingIdentity,
  strongestLink,
} from './money'
import { dayFacts, monthlySeries } from './series'

/** Drops the per-day working set before the story is sent to the interface. */
export function forInterface(full: StoryWithFacts): Story {
  return {
    months: full.months,
    chapters: full.chapters,
    insights: full.insights,
    links: full.links,
  }
}

/** Runs the whole insight pipeline once over the decoded data. Pure and deterministic. */
export function buildStory(life: LifeData): StoryWithFacts {
  const months = monthlySeries(life)
  const facts = dayFacts(life)
  const chapters = buildChapters(life, months, facts)
  const links = findLinks(life, facts)
  const insights = [
    nightOwl(life, facts),
    comfortLoop(life, facts),
    peakYear(life, facts),
    restlessYear(life),
    explorerToLoyalist(life, facts),
    streaks(life, facts, months),
    spendingIdentity(life),
    listeningAndSpending(months, facts),
    strongestLink(links),
    cardPlaces(life),
    dataHonesty(life),
  ].filter((insight): insight is Insight => insight !== null)
  return { months, facts, chapters, insights, links }
}
export * from './epilogue'
