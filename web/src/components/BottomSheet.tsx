import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  peek: ReactNode
  expanded: ReactNode
}

export default function BottomSheet({ peek, expanded }: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 rounded-t-lg border-t border-border bg-surface-raised shadow-lg">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse route details' : 'Expand route details'}
        className="flex w-full items-center justify-center py-2 text-ink-subtle"
      >
        {isExpanded ? <ChevronDown strokeWidth={1.5} size={20} /> : <ChevronUp strokeWidth={1.5} size={20} />}
      </button>
      <div className="max-h-[45vh] overflow-y-auto px-4 pb-4">{peek}</div>
      <div
        className={cn(
          'overflow-y-auto px-4 pb-6 transition-[max-height,opacity] duration-200',
          isExpanded ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        {expanded}
      </div>
    </div>
  )
}
