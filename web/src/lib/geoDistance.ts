import { metersToMiles } from '@/lib/units'

const KM_PER_DEG_LAT = 110.54
const KM_PER_DEG_LON_AT_EQUATOR = 111.32
const METERS_PER_KILOMETER = 1000

export type LonLat = [number, number]

export function distanceKm(a: LonLat, b: LonLat): number {
  const latMidRadians = (((a[1] + b[1]) / 2) * Math.PI) / 180
  const dxKm = (a[0] - b[0]) * KM_PER_DEG_LON_AT_EQUATOR * Math.cos(latMidRadians)
  const dyKm = (a[1] - b[1]) * KM_PER_DEG_LAT
  return Math.hypot(dxKm, dyKm)
}

export function distanceMiles(a: LonLat, b: LonLat): number {
  return metersToMiles(distanceKm(a, b) * METERS_PER_KILOMETER)
}
