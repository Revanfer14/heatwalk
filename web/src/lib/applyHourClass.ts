import type { BlockFeature, BlocksGeoJson } from '@/lib/types'
import type { BlocksHours } from '@/lib/districtTypes'
import { formatCelsius } from '@/lib/units'

export function applyHourClass(blocks: BlocksGeoJson, blocksHours: BlocksHours | null, hour: string | null): BlocksGeoJson {
  const features: BlockFeature[] = blocks.features.map((feature) => {
    const hourRecord = hour === null ? undefined : blocksHours?.[feature.properties.block_id]?.[hour]
    const meanC = hourRecord?.mean_c ?? feature.properties.shortest.mean_c
    const stamped = { ...feature.properties, temp_label: formatCelsius(meanC) }
    if (hourRecord === undefined) return { ...feature, properties: stamped }
    return { ...feature, properties: { ...stamped, class: hourRecord.class } }
  })

  return { ...blocks, features }
}
