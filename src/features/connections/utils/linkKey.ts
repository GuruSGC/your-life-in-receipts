import type { Link } from '@/features/insights'

export const linkKey = (link: Link): string => `${link.window}:${link.artist}:${link.theme}`
