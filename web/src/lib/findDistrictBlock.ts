import type { BlockFeature, BlocksGeoJson } from '@/lib/types'

export function findDistrictBlock(districtBlocks: BlocksGeoJson | null, blockId: string | null): BlockFeature | null {
  if (districtBlocks === null || blockId === null) return null
  return districtBlocks.features.find((feature) => feature.properties.block_id === blockId) ?? null
}
