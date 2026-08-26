import ClassificationBadge from '@/components/ClassificationBadge'
import type { BlockClass } from '@/lib/types'
import { cn } from '@/lib/utils'

const BLOCK_CLASSES: BlockClass[] = ['green', 'yellow', 'red']

interface ZoneLegendProps {
  dimmed?: boolean
}

export default function ZoneLegend({ dimmed = false }: ZoneLegendProps) {
  return (
    <ul
      className={cn('flex flex-col gap-1.5', dimmed && 'opacity-50')}
      aria-label={dimmed ? 'Zone classification legend, heat data hidden' : 'Zone classification legend'}
    >
      {BLOCK_CLASSES.map((blockClass) => (
        <li key={blockClass}>
          <ClassificationBadge blockClass={blockClass} />
        </li>
      ))}
    </ul>
  )
}
