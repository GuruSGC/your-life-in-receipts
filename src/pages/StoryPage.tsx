import { useCallback } from 'react'
import { ChapterView } from '@/features/story/components/ChapterView'
import { DataGate } from '@/components/DataGate'
import { useHashRoute } from '@/hooks/useHashRoute'

export default function StoryPage() {
  const { params, navigate } = useHashRoute()
  const requested = Number(params.get('chapter') ?? '1')
  const step = useCallback((index: number) => navigate(`/story?chapter=${index}`), [navigate])
  return (
    <DataGate>
      {({ life, story }) => {
        const index = Number.isInteger(requested)
          ? Math.min(Math.max(requested, 1), story.chapters.length)
          : 1
        const chapter = story.chapters[index - 1]
        if (!chapter) return null
        return (
          <>
            <nav
              aria-label="Chapter list"
              className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
            >
              <ol className="flex min-w-max gap-2">
                {story.chapters.map((item) => {
                  const active = item.index === chapter.index
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
            <div
              className="mb-6 h-1 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label="Story progress"
              aria-valuemin={1}
              aria-valuemax={story.chapters.length}
              aria-valuenow={chapter.index}
            >
              <div
                className="fade-swap h-full origin-left rounded-full bg-accent"
                style={{ transform: `scaleX(${chapter.index / story.chapters.length})` }}
              />
            </div>
            <ChapterView life={life} story={story} chapter={chapter} onStep={step} />
          </>
        )
      }}
    </DataGate>
  )
}
