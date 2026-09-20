import { Pause, Play } from '@phosphor-icons/react'
import { useCallback } from 'react'
import { DataGate } from '@/components/DataGate'
import type { LifeData, Story } from '@/types'
import { ChapterView } from '@/features/story/components/ChapterView'
import { useAutoplay } from '@/hooks/useAutoplay'
import { useHashRoute } from '@/hooks/useHashRoute'

const AUTOPLAY_MS = 9000

function ChapterList({ story, current }: { story: Story; current: number }) {
  return (
    <nav aria-label="Chapter list" className="-mx-4 mb-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <ol className="flex min-w-max gap-2">
        {story.chapters.map((item) => {
          const active = item.index === current
          return (
            <li key={item.id}>
              <a
                href={`#/story?chapter=${item.index}`}
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line-strong bg-surface text-ink-2 hover:border-accent'
                }`}
              >
                <span className="mono">{item.index}</span>
                <span>{item.persona}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StoryBody({ life, story }: { life: LifeData; story: Story }) {
  const { params, navigate } = useHashRoute()
  const total = story.chapters.length
  const requested = Number(params.get('chapter') ?? '1')
  const index = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), total) : 1
  const chapter = story.chapters[index - 1]
  const step = useCallback((next: number) => navigate(`/story?chapter=${next}`), [navigate])
  const advance = useCallback((): boolean => {
    if (index >= total) return false
    step(index + 1)
    return index + 1 < total
  }, [index, total, step])
  const { playing, toggle } = useAutoplay(advance, AUTOPLAY_MS)
  if (!chapter) return null
  return (
    <>
      <ChapterList story={story} current={chapter.index} />
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          className="btn btn-ghost shrink-0"
          aria-pressed={playing}
          onClick={toggle}
        >
          {playing ? (
            <Pause size={18} weight="fill" aria-hidden={true} />
          ) : (
            <Play size={18} weight="fill" aria-hidden={true} />
          )}
          {playing ? 'Pause' : 'Play the story'}
        </button>
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Story progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={chapter.index}
        >
          <div
            className="fade-swap h-full origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${chapter.index / total})` }}
          />
        </div>
      </div>
      <ChapterView life={life} story={story} chapter={chapter} onStep={step} />
    </>
  )
}

/** Page: the story, one chapter at a time, with an optional guided play-through. */
export default function StoryPage() {
  return <DataGate>{({ life, story }) => <StoryBody life={life} story={story} />}</DataGate>
}
