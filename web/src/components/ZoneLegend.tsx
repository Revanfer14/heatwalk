import ClassificationBadge from '@/components/ClassificationBadge'
import type { BlockClass } from '@/lib/types'

const BLOCK_CLASSES: BlockClass[] = ['green', 'yellow', 'red']

export default function ZoneLegend() {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Zone classification legend">
      {BLOCK_CLASSES.map((blockClass) => (
        <li key={blockClass}>
          <ClassificationBadge blockClass={blockClass} />
        </li>
      ))}
    </ul>
  )
}
