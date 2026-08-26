import type { BlockClass } from '@/lib/types'

export function classify(shortestDose: number, coolestDose: number, threshold: number): BlockClass {
  if (shortestDose <= threshold) return 'green'
  if (coolestDose <= threshold) return 'yellow'
  return 'red'
}

export function safeUntilHour(
  coolestDoseByHour: Record<string, number>,
  hours: string[],
  threshold: number,
  blockClass: BlockClass,
): string | null {
  if (blockClass !== 'red') return null

  let previousHour: string | null = null
  for (const hour of hours) {
    const dose = coolestDoseByHour[hour]
    if (dose === undefined) continue
    if (dose > threshold) return previousHour
    previousHour = hour
  }
  return null
}
