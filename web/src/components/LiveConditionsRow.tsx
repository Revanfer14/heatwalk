import TemperaturePair from '@/components/TemperaturePair'
import { formatHourAmPm, formatSignedTemperature } from '@/lib/units'
import type { LiveTemperatureStatus } from '@/hooks/useLiveTemperature'

interface LiveConditionsRowProps {
  hour: string
  status: LiveTemperatureStatus
  liveMedianC: number | null
  offsetC: number
}

export default function LiveConditionsRow({ hour, status, liveMedianC, offsetC }: LiveConditionsRowProps) {
  const hourLabel = formatHourAmPm(hour)

  if (status === 'starting' || status === 'polling') {
    return <p className="text-xs text-ink-subtle">Now · {hourLabel} · checking today's conditions…</p>
  }

  if (status === 'live' && liveMedianC !== null) {
    return (
      <p className="text-xs text-ink-subtle">
        Now · {hourLabel} · <TemperaturePair celsius={liveMedianC} className="text-ink-muted" />{' '}
        ({formatSignedTemperature(offsetC)} vs. modeled day)
      </p>
    )
  }

  return <p className="text-xs text-ink-subtle">Now · {hourLabel}</p>
}
