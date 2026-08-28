const VALUE_KEY_CANDIDATES = [
  'average_temperature',
  'value',
  'tcm',
  'temperature',
  'temp_c',
  'temperature_c',
  'mean',
  'avg_temp',
]
const NODATA_SENTINELS = new Set([-999, -999.0])
const GRID_VALUE_ROUNDING_FACTOR = 10

export interface HeatmapFeature {
  properties?: Record<string, unknown>
  geometry?: { coordinates?: number[][][] }
}

export interface HeatmapMapData {
  features?: HeatmapFeature[]
}

export interface TemperatureGrid {
  west: number
  north: number
  pixelDx: number
  pixelDy: number
  cols: number
  rows: number
  values: (number | null)[]
}

export function detectValueKey(features: HeatmapFeature[]): string | null {
  const firstProperties = features[0]?.properties ?? {}
  for (const key of VALUE_KEY_CANDIDATES) {
    if (key in firstProperties) return key
  }
  return null
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middleIndex = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2 : sorted[middleIndex]
}

export function medianTemperature(mapData: HeatmapMapData): number | null {
  const features = mapData.features ?? []
  const valueKey = detectValueKey(features)
  if (valueKey === null) return null

  const values: number[] = []
  for (const feature of features) {
    const raw = feature.properties?.[valueKey]
    if (typeof raw !== 'number') continue
    if (NODATA_SENTINELS.has(raw)) continue
    values.push(raw)
  }
  return median(values)
}

function cellBounds(feature: HeatmapFeature): [number, number, number, number] | null {
  const coords = feature.geometry?.coordinates?.[0]
  if (coords === undefined) return null
  const xs = coords.map((point) => point[0])
  const ys = coords.map((point) => point[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

export function buildTemperatureGrid(mapData: HeatmapMapData): TemperatureGrid | null {
  const features = mapData.features ?? []
  const valueKey = detectValueKey(features)
  if (valueKey === null) return null

  const cellBoxes = features
    .map(cellBounds)
    .filter((box): box is [number, number, number, number] => box !== null)
  if (cellBoxes.length === 0) return null

  const pixelDx = median(cellBoxes.map((box) => box[2] - box[0])) ?? 0
  const pixelDy = median(cellBoxes.map((box) => box[3] - box[1])) ?? 0
  if (pixelDx <= 0 || pixelDy <= 0) return null

  const west = Math.min(...cellBoxes.map((box) => box[0]))
  const south = Math.min(...cellBoxes.map((box) => box[1]))
  const east = Math.max(...cellBoxes.map((box) => box[2]))
  const north = Math.max(...cellBoxes.map((box) => box[3]))

  const cols = Math.max(Math.round((east - west) / pixelDx), 1)
  const rows = Math.max(Math.round((north - south) / pixelDy), 1)
  const values: (number | null)[] = new Array(cols * rows).fill(null)

  features.forEach((feature, index) => {
    const box = cellBoxes[index]
    if (box === undefined) return
    const raw = feature.properties?.[valueKey]
    if (typeof raw !== 'number' || NODATA_SENTINELS.has(raw)) return

    const centerX = (box[0] + box[2]) / 2
    const centerY = (box[1] + box[3]) / 2
    const col = Math.floor((centerX - west) / pixelDx)
    const row = Math.floor((north - centerY) / pixelDy)
    if (col < 0 || col >= cols || row < 0 || row >= rows) return
    values[row * cols + col] = Math.round(raw * GRID_VALUE_ROUNDING_FACTOR) / GRID_VALUE_ROUNDING_FACTOR
  })

  return { west, north, pixelDx, pixelDy, cols, rows, values }
}
