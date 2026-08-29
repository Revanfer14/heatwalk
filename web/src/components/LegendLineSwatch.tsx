import { cn } from '@/lib/utils'

interface LegendLineSwatchProps {
  dashed: boolean
  className?: string
}

export default function LegendLineSwatch({ dashed, className }: LegendLineSwatchProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 2" className={cn('h-[2px] w-5 shrink-0 text-ink', className)}>
      <line
        x1="0"
        y1="1"
        x2="20"
        y2="1"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={dashed ? '4 3' : undefined}
      />
    </svg>
  )
}
