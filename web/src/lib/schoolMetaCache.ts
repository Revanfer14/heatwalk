import type { SchoolTemps, TempsMeta } from '@/lib/types'

const schoolMetaCache = new Map<string, Promise<TempsMeta>>()

export function loadSchoolMeta(schoolId: string): Promise<TempsMeta> {
  const cached = schoolMetaCache.get(schoolId)
  if (cached !== undefined) return cached

  const promise = fetch(`/data/by_school/${schoolId}/temps.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch temps.json for ${schoolId}: ${response.status}`)
      }
      return response.json() as Promise<SchoolTemps>
    })
    .then((temps) => temps.meta)

  schoolMetaCache.set(schoolId, promise)
  promise.catch(() => schoolMetaCache.delete(schoolId))
  return promise
}
