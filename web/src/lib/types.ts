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
  temp_label?: string
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
  misclassified_by_hour: Record<string, SchoolMisclassified>
  dose_eliminated_per_child_per_day: number
  dose_eliminated_per_child_per_year: number
  equivalent_minutes_at_42c: number
  correction_factor: number | null
  radius_setara_dosis_mi: number
  radius_kebijakan_mi: number
  days_exceedance_per_year: number
}

export type SummaryBySchool = Record<string, SchoolSummary>

export interface Tile {
  id: string
  bbox: [number, number, number, number]
  status: 'pending' | 'done'
  hours_fetched: string[]
  modeled_median_c_by_hour: Record<string, number>
}

export type GraphNode = [number, number]

export interface GraphEdge {
  u: string
  v: string
  len_m: number
  geom: number[][]
}

export interface GraphMeta {
  school_id: string
  tile_id: string
  crs: string
}

export interface SchoolGraph {
  meta: GraphMeta
  nodes: Record<string, GraphNode>
  edges: Record<string, GraphEdge>
}

export type EdgeHourTriple = [number, number, number]

export interface TempsMeta {
  hours: string[]
  canonical_hour: string
  baseline_c: number
  threshold: number
  lambda_detour: number
  fetched_at: string
}

export interface SchoolTemps {
  meta: TempsMeta
  edges: Record<string, Record<string, EdgeHourTriple>>
}

export interface RouteHeatSegment {
  edgeId: string
  temp_c: number
  geometry: number[][]
}

export interface SolvedRouteLeg extends RouteLeg {
  minutes: number
  geometry: number[][]
  segments: RouteHeatSegment[]
}

export interface SolvedRoutes {
  originNode: string
  schoolNode: string
  shortest: SolvedRouteLeg
  coolest: SolvedRouteLeg
  alternates: SolvedRouteLeg[]
}
