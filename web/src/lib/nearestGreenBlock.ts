import type { BlockFeature } from '@/lib/types'

export function deltaVsNearestGreenBlock(target: BlockFeature, allBlocks: BlockFeature[]): number | null {
  const targetDistanceMi = target.properties.distance_mi
  const greenBlocks = allBlocks.filter(
    (block) => block.properties.class === 'green' && block.properties.block_id !== target.properties.block_id,
  )
  if (greenBlocks.length === 0) return null

  let closest = greenBlocks[0]
  let closestDistanceGap = Math.abs(closest.properties.distance_mi - targetDistanceMi)
  for (const block of greenBlocks) {
    const distanceGap = Math.abs(block.properties.distance_mi - targetDistanceMi)
    if (distanceGap < closestDistanceGap) {
      closest = block
      closestDistanceGap = distanceGap
    }
  }
  return target.properties.coolest.mean_c - closest.properties.coolest.mean_c
}
