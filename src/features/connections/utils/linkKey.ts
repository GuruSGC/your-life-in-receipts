import type { Link } from '@/features/insights'

/** A stable identifier for a link, used to select it. */
export const linkKey = (link: Link): string => `${link.window}:${link.artist}:${link.theme}`
