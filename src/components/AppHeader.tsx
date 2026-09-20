import {
  BookOpenText,
  MagnifyingGlass,
  Pulse,
  Receipt as ReceiptIcon,
  ShareNetwork,
  type Icon,
} from '@phosphor-icons/react'
import { ROUTES, type RouteId } from '@/constants'
import { ThemeToggle } from './ThemeToggle'

const ICONS: Partial<Record<RouteId, Icon>> = {
  receipt: ReceiptIcon,
  story: BookOpenText,
  connections: ShareNetwork,
  rhythms: Pulse,
  explore: MagnifyingGlass,
}

interface LinkProps {
  id: RouteId
  path: string
  label: string
  current: RouteId
  stacked?: boolean
}

function NavLink({ id, path, label, current, stacked = false }: LinkProps) {
  const Glyph = ICONS[id]
  const active = current === id
  const layout = stacked ? 'min-h-14 flex-col gap-0.5 text-[0.7rem]' : 'min-h-11 gap-1.5'
  return (
    <a
      href={`#${path}`}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors ${layout} ${
        active ? 'text-accent' : 'text-ink-2 hover:text-ink'
      }`}
    >
      {Glyph ? (
        <Glyph size={stacked ? 22 : 18} weight={active ? 'bold' : 'regular'} aria-hidden={true} />
      ) : null}
      <span className={active ? 'border-b-2 border-accent' : 'border-b-2 border-transparent'}>
        {label}
      </span>
    </a>
  )
}

/** The top navigation on desktop and the bottom navigation on phones, with the theme toggle. */
export function AppHeader({ current }: { current: RouteId }) {
  const items = ROUTES.filter((route) => route.id !== 'method')
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <a href="#/" className="flex min-h-11 items-center gap-2.5 font-semibold tracking-tight">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-lg bg-accent text-accent-ink"
            >
              <ReceiptIcon size={20} weight="bold" aria-hidden={true} />
            </span>
            <span className="leading-tight">
              Your Life,
              <br className="md:hidden" /> <span className="text-accent">In Receipts</span>
            </span>
          </a>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {items.map((route) => (
                <li key={route.id}>
                  <NavLink id={route.id} path={route.path} label={route.label} current={current} />
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <nav
        aria-label="Primary, mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items.map((route) => (
            <li key={route.id}>
              <NavLink
                id={route.id}
                path={route.path}
                label={route.label}
                current={current}
                stacked
              />
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
