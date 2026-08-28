import Metric from '@/components/Metric'
import HeatValue from '@/components/HeatValue'
import TemperaturePair from '@/components/TemperaturePair'
import { formatKilometers, formatMinutes, metersToKilometers } from '@/lib/units'
import type { SolvedRouteLeg } from '@/lib/types'

interface RouteOptionCardProps {
  label: string
  route: SolvedRouteLeg
  emphasize?: boolean
  isLive?: boolean
  selected?: boolean
  onSelect?: () => void
}

export default function RouteOptionCard({
  label,
  route,
  emphasize = false,
  isLive = false,
  selected = false,
  onSelect,
}: RouteOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-ink bg-surface' : 'border-border'
      }`}
    >
      <p className="text-xs font-medium text-ink-muted">
        {label}
        {isLive && ' · today'}
      </p>
      <div className="flex items-baseline gap-2 text-sm tabular-nums text-ink">
        <span className="font-medium">{formatMinutes(route.minutes)}</span>
        <span className="text-ink-subtle">·</span>
        <span>{formatKilometers(metersToKilometers(route.len_m))}</span>
      </div>
      <Metric
        label="Mean temperature"
        value={
          <HeatValue>
            <TemperaturePair celsius={route.mean_c} />
          </HeatValue>
        }
        size={emphasize ? 'headline' : 'default'}
      />
    </button>
  )
}
