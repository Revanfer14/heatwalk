import { buildTemperatureGrid, medianTemperature, type HeatmapMapData } from './_lib/heatmapGrid'

export const config = { runtime: 'edge' }

const FG_BASE_URL = 'https://api.fortyguard.com/v1'
const ACTIVITY_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/
const MEDIAN_ROUNDING_FACTOR = 100

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const activityId = url.searchParams.get('activityId')

  if (activityId === null || !ACTIVITY_ID_PATTERN.test(activityId)) {
    return Response.json({ error: 'invalid activity id' }, { status: 400 })
  }

  const apiKey = process.env.FORTYGUARD_API_KEY
  if (apiKey === undefined || apiKey.length === 0) {
    return Response.json({ error: 'server not configured' }, { status: 500 })
  }

  const fortyGuardResponse = await fetch(`${FG_BASE_URL}/status/${activityId}`, {
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
  })

  if (!fortyGuardResponse.ok) {
    return Response.json({ state: 'failed' })
  }

  const body = (await fortyGuardResponse.json()) as {
    data?: { status?: string; result?: { map_data?: HeatmapMapData } }
  }
  const status = body.data?.status

  if (status === 'Failed') return Response.json({ state: 'failed' })
  if (status !== 'Completed') return Response.json({ state: 'pending' })

  const mapData = body.data?.result?.map_data
  const medianC = mapData === undefined ? null : medianTemperature(mapData)
  if (medianC === null) return Response.json({ state: 'failed' })

  const grid = mapData === undefined ? null : buildTemperatureGrid(mapData)

  return Response.json({
    state: 'ready',
    medianC: Math.round(medianC * MEDIAN_ROUNDING_FACTOR) / MEDIAN_ROUNDING_FACTOR,
    grid,
  })
}
