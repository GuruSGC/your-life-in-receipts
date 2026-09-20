import type { Story } from '@/types'
import { epilogueOf } from '@/services/insights/epilogue'

/** The last thing the story says: what the seven chapters add up to. Shown after the final chapter. */
export function Epilogue({ story }: { story: Story }) {
  const paragraphs = epilogueOf(story)
  if (paragraphs.length === 0) return null
  return (
    <section className="ticket mt-10 max-w-3xl" aria-labelledby="epilogue-title">
      <p className="mono text-xs uppercase tracking-[0.14em] text-accent">The end of the tape</p>
      <h2 id="epilogue-title" className="mt-1 text-2xl">
        What it all means
      </h2>
      {paragraphs.map((text) => (
        <p key={text} className="mt-3 text-lg text-ink-2">
          {text}
        </p>
      ))}
    </section>
  )
}
