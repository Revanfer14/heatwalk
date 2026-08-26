export const WALK_SPEED_MPS = 1.2

export function doseCMin(tempC: number, lenM: number, baselineC: number): number {
  return (Math.max(tempC - baselineC, 0) * (lenM / WALK_SPEED_MPS)) / 60
}

export function weightCool(doseValue: number, lenM: number, lambdaDetour: number): number {
  return doseValue + lambdaDetour * lenM
}

export function walkMinutes(lenM: number): number {
  return lenM / WALK_SPEED_MPS / 60
}
