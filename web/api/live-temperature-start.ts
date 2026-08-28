export const config = { runtime: 'edge' }

const FG_BASE_URL = 'https://api.fortyguard.com/v1'
const LIVE_TILE_HALF_SIDE_KM = 2.5
const KM_PER_DEG_LAT = 110.54
const KM_PER_DEG_LON_AT_EQUATOR = 111.32
const GRANULARITY_M = 60
const ALLOWED_HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
const START_CACHE_SECONDS = 3600

interface SchoolLocation {
  id: string
  lon: number
  lat: number
}

function todayDateInOrlando(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function schoolTileBbox(school: SchoolLocation): [number, number, number, number] {
  const latRadians = (school.lat * Math.PI) / 180
  const halfWidthDeg = LIVE_TILE_HALF_SIDE_KM / (KM_PER_DEG_LON_AT_EQUATOR * Math.cos(latRadians))
  const halfHeightDeg = LIVE_TILE_HALF_SIDE_KM / KM_PER_DEG_LAT
  return [
    school.lon - halfWidthDeg,
    school.lat - halfHeightDeg,
    school.lon + halfWidthDeg,
    school.lat + halfHeightDeg,
  ]
}

function aoiPolygonFeatureCollection(bbox: [number, number, number, number]) {
  const [west, south, east, north] = bbox
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  }
}

async function findSchool(request: Request, schoolId: string): Promise<SchoolLocation | null> {
  const schoolsUrl = new URL('/data/schools.json', request.url)
  const response = await fetch(schoolsUrl)
  if (!response.ok) return null
  const schools = (await response.json()) as SchoolLocation[]
  return schools.find((school) => school.id === schoolId) ?? null
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const hour = url.searchParams.get('hour')
  const schoolId = url.searchParams.get('schoolId')

  if (hour === null || !ALLOWED_HOURS.includes(hour)) {
    return Response.json({ error: 'invalid hour' }, { status: 400 })
  }
  if (schoolId === null || schoolId.length === 0) {
    return Response.json({ error: 'invalid schoolId' }, { status: 400 })
  }

  const school = await findSchool(request, schoolId)
  if (school === null) {
    return Response.json({ error: 'unknown schoolId' }, { status: 400 })
  }

  const apiKey = process.env.FORTYGUARD_API_KEY
  if (apiKey === undefined || apiKey.length === 0) {
    return Response.json({ error: 'server not configured' }, { status: 500 })
  }

  const payload = {
    polygon_aoi: aoiPolygonFeatureCollection(schoolTileBbox(school)),
    date_time: { start_date: todayDateInOrlando(), start_time: hour, filter_type: 1 },
    granularity: GRANULARITY_M,
    analytic_type: 'tcm',
  }

  const fortyGuardResponse = await fetch(`${FG_BASE_URL}/heatmap`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!fortyGuardResponse.ok) {
    return Response.json({ error: 'fortyguard submit failed' }, { status: 502 })
  }

  const body = (await fortyGuardResponse.json()) as { data?: { activity_id?: string } }
  const activityId = body.data?.activity_id
  if (typeof activityId !== 'string' || activityId.length === 0) {
    return Response.json({ error: 'fortyguard did not return an activity id' }, { status: 502 })
  }

  return Response.json(
    { activityId },
    { headers: { 'Cache-Control': `public, s-maxage=${START_CACHE_SECONDS}` } },
  )
}
