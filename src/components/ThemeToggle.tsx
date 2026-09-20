import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      className="btn btn-ghost size-11 !px-0"
    >
      {dark ? (
        <Sun size={22} weight="bold" aria-hidden={true} />
      ) : (
        <Moon size={22} weight="bold" aria-hidden={true} />
      )}
    </button>
  )
}
