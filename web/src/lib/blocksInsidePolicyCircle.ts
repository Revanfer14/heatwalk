import { distanceMiles, type LonLat } from '@/lib/geoDistance'
import { polygonCentroid } from '@/lib/polygonCentroid'
import type { BlocksGeoJson } from '@/lib/types'

export function blocksInsidePolicyCircle(
  blocks: BlocksGeoJson,
  center: LonLat,
  radiusMi: number,
): BlocksGeoJson {
  const features = blocks.features.filter(
    (feature) => distanceMiles(polygonCentroid(feature.geometry), center) <= radiusMi,
  )
  return { ...blocks, features }
}
