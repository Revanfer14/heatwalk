import type { SchoolNational } from '@/lib/districtTypes'

export function toNationalSchoolsFeatureCollection(nationalSchools: SchoolNational[]) {
  return {
    type: 'FeatureCollection' as const,
    features: nationalSchools.map((school) => ({
      type: 'Feature' as const,
      properties: school,
      geometry: { type: 'Point' as const, coordinates: [school.lon, school.lat] },
    })),
  }
}
