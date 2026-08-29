import type { BlocksGeoJson } from '@/lib/types'

export function blocksForSchool(blocks: BlocksGeoJson, schoolId: string): BlocksGeoJson {
  const features = blocks.features.filter((feature) => feature.properties.school_id === schoolId)
  return { ...blocks, features }
}
