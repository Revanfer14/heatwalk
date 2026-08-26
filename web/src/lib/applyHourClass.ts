import type { BlockFeature, BlocksGeoJson } from '@/lib/types'
import type { BlocksHours } from '@/lib/districtTypes'

export function applyHourClass(blocks: BlocksGeoJson, blocksHours: BlocksHours | null, hour: string | null): BlocksGeoJson {
  if (blocksHours === null || hour === null) return blocks

  const features: BlockFeature[] = blocks.features.map((feature) => {
    const hourRecord = blocksHours[feature.properties.block_id]?.[hour]
    if (hourRecord === undefined) return feature
    return { ...feature, properties: { ...feature.properties, class: hourRecord.class } }
  })

  return { ...blocks, features }
}
