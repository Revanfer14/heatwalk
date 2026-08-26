import { cn } from '@/lib/utils'
import { formatTemperaturePair } from '@/lib/units'

interface TemperaturePairProps {
  celsius: number
  className?: string
}

export default function TemperaturePair({ celsius, className }: TemperaturePairProps) {
  return <span className={cn('tabular-nums', className)}>{formatTemperaturePair(celsius)}</span>
}
