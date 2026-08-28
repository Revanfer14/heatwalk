export interface GeocodeResult {
  lon: number
  lat: number
  displayName: string
}

interface NominatimSearchResult {
  lat: string
  lon: string
  display_name: string
}

interface NominatimReverseResult {
  lat?: string
  lon?: string
  display_name?: string
  error?: string
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_SUGGESTION_LIMIT = 5
const NOMINATIM_FORMAT = 'jsonv2'

export async function geocodeSuggestions(
  query: string,
  bbox: [number, number, number, number],
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) return []

  const [west, south, east, north] = bbox
  const params = new URLSearchParams({
    format: NOMINATIM_FORMAT,
    q: trimmedQuery,
    viewbox: `${west},${south},${east},${north}`,
    bounded: '1',
    limit: String(NOMINATIM_SUGGESTION_LIMIT),
  })

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`)
  }

  const results = (await response.json()) as NominatimSearchResult[]
  return results.map((result) => ({
    lon: Number.parseFloat(result.lon),
    lat: Number.parseFloat(result.lat),
    displayName: result.display_name,
  }))
}

export async function reverseGeocode(lon: number, lat: number, signal?: AbortSignal): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    format: NOMINATIM_FORMAT,
    lat: String(lat),
    lon: String(lon),
  })

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`Nominatim reverse geocode failed: ${response.status}`)
  }

  const result = (await response.json()) as NominatimReverseResult
  if (result.display_name === undefined) return null

  return {
    lon: result.lon !== undefined ? Number.parseFloat(result.lon) : lon,
    lat: result.lat !== undefined ? Number.parseFloat(result.lat) : lat,
    displayName: result.display_name,
  }
}
