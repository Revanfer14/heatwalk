import type { BlocksGeoJson } from '@/lib/types'
import type { BlocksHours } from '@/lib/districtTypes'

let districtBlocksPromise: Promise<BlocksGeoJson> | null = null
let districtBlocksHoursPromise: Promise<BlocksHours> | null = null

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function loadDistrictBlocks(): Promise<BlocksGeoJson> {
  if (districtBlocksPromise === null) {
    districtBlocksPromise = fetchJson<BlocksGeoJson>('/data/district_blocks.geojson')
    districtBlocksPromise.catch(() => {
      districtBlocksPromise = null
    })
  }
  return districtBlocksPromise
}

export function loadDistrictBlocksHours(): Promise<BlocksHours> {
  if (districtBlocksHoursPromise === null) {
    districtBlocksHoursPromise = fetchJson<BlocksHours>('/data/district_blocks_hours.json')
    districtBlocksHoursPromise.catch(() => {
      districtBlocksHoursPromise = null
    })
  }
  return districtBlocksHoursPromise
}
