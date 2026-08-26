import { formatMiles } from '@/lib/units'
import type { School } from '@/lib/types'

interface StatusSentenceProps {
  distanceMiles: number
  school: School
}

export default function StatusSentence({ distanceMiles, school }: StatusSentenceProps) {
  const isWithinWalkZone = distanceMiles <= school.walk_radius_mi
  const zoneLabel = isWithinWalkZone ? 'inside the walk zone' : 'outside the walk zone, bus eligible by distance'

  return (
    <p className="text-base text-ink">
      Your home is <span className="font-medium tabular-nums">{formatMiles(distanceMiles)}</span> from {school.name}
      {' — '}
      {zoneLabel}.
    </p>
  )
}
