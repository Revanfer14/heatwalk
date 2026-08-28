export interface LiveTemperatureGrid {
  west: number
  north: number
  pixelDx: number
  pixelDy: number
  cols: number
  rows: number
  values: (number | null)[]
}

export function sampleGridAt(grid: LiveTemperatureGrid, lon: number, lat: number): number | null {
  const col = Math.floor((lon - grid.west) / grid.pixelDx)
  const row = Math.floor((grid.north - lat) / grid.pixelDy)
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return null
  return grid.values[row * grid.cols + col] ?? null
}
