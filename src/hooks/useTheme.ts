import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { STORAGE_THEME_KEY } from '@/constants'
import { readJson, writeJson } from '@/services/storage'

export type ThemeChoice = 'light' | 'dark'

const isChoice = (value: unknown): value is ThemeChoice => value === 'light' || value === 'dark'
const systemChoice = (): ThemeChoice =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

/** Reads the saved theme (or the system one) and applies it before React renders, to avoid a flash. */
export function applyInitialTheme(): ThemeChoice {
  const saved = readJson<ThemeChoice | null>(
    STORAGE_THEME_KEY,
    (v): v is ThemeChoice => isChoice(v),
    null,
  )
  const theme = saved ?? systemChoice()
  document.documentElement.dataset.theme = theme
  return theme
}

/** The current theme and a function that toggles it, remembering the choice. */
export function useTheme(): { theme: ThemeChoice; toggle: () => void } {
  const [theme, setTheme] = useState<ThemeChoice>(() =>
    isChoice(document.documentElement.dataset.theme)
      ? document.documentElement.dataset.theme
      : 'light',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const toggle = useCallback(() => {
    const next: ThemeChoice = theme === 'dark' ? 'light' : 'dark'
    writeJson(STORAGE_THEME_KEY, next)
    const apply = (): void => setTheme(next)
    const start = document.startViewTransition?.bind(document)
    if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) apply()
    else start(() => flushSync(apply))
  }, [theme])
  return { theme, toggle }
}
