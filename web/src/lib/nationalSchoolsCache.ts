import type { SchoolNational } from '@/lib/districtTypes'

let cachedPromise: Promise<SchoolNational[]> | null = null

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function loadNationalSchools(): Promise<SchoolNational[]> {
  if (cachedPromise !== null) return cachedPromise

  cachedPromise = fetchJson<SchoolNational[]>('/data/schools_national.json')
  cachedPromise.catch(() => {
    cachedPromise = null
  })
  return cachedPromise
}
