export type LonLatBounds = [[number, number], [number, number]]

export function boundsFromCoordinates(coordinates: number[][]): LonLatBounds | null {
  if (coordinates.length === 0) return null

  let west = coordinates[0][0]
  let east = coordinates[0][0]
  let south = coordinates[0][1]
  let north = coordinates[0][1]

  for (const [lon, lat] of coordinates) {
    if (lon < west) west = lon
    if (lon > east) east = lon
    if (lat < south) south = lat
    if (lat > north) north = lat
  }

  return [
    [west, south],
    [east, north],
  ]
}
