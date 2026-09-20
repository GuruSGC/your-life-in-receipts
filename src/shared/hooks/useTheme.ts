import { useCallback, useEffect, useState } from 'react'
import { STORAGE_THEME_KEY } from '@/shared/constants'
import { readJson, writeJson } from '@/shared/services/storage'

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
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      writeJson(STORAGE_THEME_KEY, next)
      return next
    })
  }, [])
  return { theme, toggle }
}
