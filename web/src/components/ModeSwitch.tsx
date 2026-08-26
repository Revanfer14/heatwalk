import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const MODES = [
  { path: '/', label: 'Parent' },
  { path: '/district', label: 'District' },
]

export default function ModeSwitch() {
  const location = useLocation()

  return (
    <nav className="flex items-center rounded-md border border-border-strong p-0.5" aria-label="Mode">
      {MODES.map((mode) => {
        const isActive = location.pathname === mode.path
        return (
          <Link
            key={mode.path}
            to={mode.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-sm px-3 py-1 text-sm font-medium transition-colors',
              isActive ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink',
            )}
          >
            {mode.label}
          </Link>
        )
      })}
    </nav>
  )
}
