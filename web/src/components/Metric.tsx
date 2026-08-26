import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetricProps {
  label: string
  value: ReactNode
  size?: 'default' | 'headline'
  className?: string
}

export default function Metric({ label, value, size = 'default', className }: MetricProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-xs font-medium text-ink-subtle">{label}</span>
      <span
        className={cn(
          'tabular-nums text-ink',
          size === 'headline' ? 'text-[2rem] leading-[1.15] font-semibold' : 'text-base',
        )}
      >
        {value}
      </span>
    </div>
  )
}
