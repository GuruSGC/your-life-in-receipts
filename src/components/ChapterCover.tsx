import { COVER_COUNT, COVER_WIDTHS } from '@/constants'

interface Props {
  /** The chapter number, from 1. Chapters beyond the art set reuse it. */
  index: number
  /** What the cover shows, for people who cannot see it. */
  alt: string
  /** Above the fold: load at once and at high priority. Otherwise the image loads when it nears the screen. */
  priority?: boolean
  /** How wide the image is drawn, so the browser picks the smallest file that is sharp enough. */
  sizes: string
  className?: string
}

/** The listening-waveform cover of one chapter, in three widths, with its size reserved so nothing shifts. */
export function ChapterCover({ index, alt, priority = false, sizes, className = '' }: Props) {
  const art = ((index - 1) % COVER_COUNT) + 1
  const file = (width: number) => `/img/chapter-${art}-${width}.webp`
  const srcSet = COVER_WIDTHS.map((width) => `${file(width)} ${width}w`).join(', ')
  const look = `block h-auto w-full rounded-xl bg-accent-soft ${className}`
  if (priority) {
    return (
      <img
        src={file(640)}
        srcSet={srcSet}
        sizes={sizes}
        width={960}
        height={360}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={look}
      />
    )
  }
  return (
    <img
      src={file(640)}
      srcSet={srcSet}
      sizes={sizes}
      width={960}
      height={360}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={look}
    />
  )
}
