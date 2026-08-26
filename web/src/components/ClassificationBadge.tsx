import { BLOCK_CLASS_LABEL } from '@/lib/classificationLabels'
import type { BlockClass } from '@/lib/types'
import { cn } from '@/lib/utils'

const SWATCH_CLASS_BY_BLOCK_CLASS: Record<BlockClass, string> = {
  green: 'bg-zone-safe',
  yellow: 'border-2 border-dashed border-zone-reroute bg-transparent',
  red: 'bg-zone-bus [background-image:repeating-linear-gradient(45deg,transparent,transparent_2px,var(--bg)_2px,var(--bg)_4px)]',
}

interface ClassificationBadgeProps {
  blockClass: BlockClass
  className?: string
}

export default function ClassificationBadge({ blockClass, className }: ClassificationBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm text-ink', className)}>
      <span
        aria-hidden="true"
        className={cn('h-3 w-3 shrink-0 rounded-sm', SWATCH_CLASS_BY_BLOCK_CLASS[blockClass])}
      />
      {BLOCK_CLASS_LABEL[blockClass]}
    </span>
  )
}
