import type { BlocksGeoJson } from '@/lib/types'
import type { BlocksHours, SegmentPriorityRow } from '@/lib/districtTypes'

const segmentsCache = new Map<string, Promise<SegmentPriorityRow[]>>()
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

export function loadSegmentPriority(schoolId: string): Promise<SegmentPriorityRow[]> {
  const cached = segmentsCache.get(schoolId)
  if (cached !== undefined) return cached

  const promise = fetchJson<SegmentPriorityRow[]>(`/data/by_school/${schoolId}/segments.json`)
  segmentsCache.set(schoolId, promise)
  promise.catch(() => segmentsCache.delete(schoolId))
  return promise
}
