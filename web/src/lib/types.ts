export type BlockClass = 'green' | 'yellow' | 'red'
export type StatusNow = 'walk' | 'bus'
export type StatusRec = 'walk' | 'reroute' | 'bus_eligible'

export interface RouteLeg {
  len_m: number
  mean_c: number
  peak_c: number
  dose: number
}

export interface PolygonGeometry {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface BlockProperties {
  block_id: string
  school_id: string
  kids_est: number
  class: BlockClass
  shortest: RouteLeg
  coolest: RouteLeg
  delta_mean_c: number
  delta_dose_pct: number
  distance_mi: number
  status_now: StatusNow
  status_rec: StatusRec
  reason: string
  safe_until_hour: string | null
}

export interface BlockFeature {
  type: 'Feature'
  geometry: PolygonGeometry
  properties: BlockProperties
}

export interface BlocksGeoJson {
  type: 'FeatureCollection'
  features: BlockFeature[]
}

export interface School {
  id: string
  name: string
  level: string
  enrollment: number
  walk_radius_mi: number
  lon: number
  lat: number
  policy_source: string
  nces_id: string
}

export interface SchoolMisclassified {
  bus_not_needed: number
  walk_should_bus: number
}

export interface SchoolSummary {
  in_walk_zone: number
  reroute_enough: number
  no_safe_route: number
  lowest_income_quartile: number
  misclassified: SchoolMisclassified
  dose_eliminated_per_child_per_day: number
  dose_eliminated_per_child_per_year: number
  equivalent_minutes_at_42c: number
  correction_factor: number | null
  radius_setara_dosis_mi: number
  radius_kebijakan_mi: number
  days_exceedance_per_year: number
}

export type SummaryBySchool = Record<string, SchoolSummary>
