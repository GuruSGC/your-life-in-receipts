import { useRef, type ReactNode } from 'react'
import { useFocusHeading } from '@/shared/hooks/useFocusHeading'

/** The page's one h1. After the first render it takes focus so route changes are announced and keyboard users start at the top. */
export function PageTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useFocusHeading(ref, 'page')
  return (
    <header className="mb-6 md:mb-8">
      {kicker ? (
        <p className="mono mb-2 text-xs uppercase tracking-[0.14em] text-accent">{kicker}</p>
      ) : null}
      <h1 ref={ref} tabIndex={-1} className="text-[clamp(1.9rem,1.2rem+3vw,3.25rem)] outline-none">
        {children}
      </h1>
    </header>
  )
}
