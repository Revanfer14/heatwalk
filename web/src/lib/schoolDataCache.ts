import type { BlocksGeoJson, SchoolGraph, SchoolTemps } from '@/lib/types'

export interface SchoolData {
  graph: SchoolGraph
  temps: SchoolTemps
  blocks: BlocksGeoJson
}

const schoolDataCache = new Map<string, Promise<SchoolData>>()

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function loadSchoolData(schoolId: string): Promise<SchoolData> {
  const cached = schoolDataCache.get(schoolId)
  if (cached !== undefined) return cached

  const basePath = `/data/by_school/${schoolId}`
  const promise = Promise.all([
    fetchJson<SchoolGraph>(`${basePath}/graph.json`),
    fetchJson<SchoolTemps>(`${basePath}/temps.json`),
    fetchJson<BlocksGeoJson>(`${basePath}/blocks.geojson`),
  ]).then(([graph, temps, blocks]) => ({ graph, temps, blocks }))

  schoolDataCache.set(schoolId, promise)
  promise.catch(() => schoolDataCache.delete(schoolId))
  return promise
}
