import type { BlocksHours, SegmentPriorityRow } from '@/lib/districtTypes'

const blocksHoursCache = new Map<string, Promise<BlocksHours>>()
const segmentsCache = new Map<string, Promise<SegmentPriorityRow[]>>()

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function loadBlocksHours(schoolId: string): Promise<BlocksHours> {
  const cached = blocksHoursCache.get(schoolId)
  if (cached !== undefined) return cached

  const promise = fetchJson<BlocksHours>(`/data/by_school/${schoolId}/blocks_hours.json`)
  blocksHoursCache.set(schoolId, promise)
  promise.catch(() => blocksHoursCache.delete(schoolId))
  return promise
}

export function loadSegmentPriority(schoolId: string): Promise<SegmentPriorityRow[]> {
  const cached = segmentsCache.get(schoolId)
  if (cached !== undefined) return cached

  const promise = fetchJson<SegmentPriorityRow[]>(`/data/by_school/${schoolId}/segments.json`)
  segmentsCache.set(schoolId, promise)
  promise.catch(() => segmentsCache.delete(schoolId))
  return promise
}
