import { ChevronLeft, X } from 'lucide-react'

interface MapPanelHeaderProps {
  title: string
  eyebrow?: string
  onBack?: () => void
  onClose?: () => void
  emphasized?: boolean
}

export default function MapPanelHeader({
  title,
  eyebrow,
  onBack,
  onClose,
  emphasized = false,
}: MapPanelHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      {onClose !== undefined ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <X strokeWidth={2} size={22} />
        </button>
      ) : (
        onBack !== undefined && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ChevronLeft strokeWidth={1.5} size={20} />
          </button>
        )
      )}
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
        <span
          className={
            emphasized
              ? 'truncate text-base font-bold tracking-tight text-ink'
              : 'truncate text-sm font-semibold tracking-tight text-ink'
          }
        >
          {title}
        </span>
        {eyebrow !== undefined && (
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">
            {eyebrow}
          </span>
        )}
      </div>
    </div>
  )
}
