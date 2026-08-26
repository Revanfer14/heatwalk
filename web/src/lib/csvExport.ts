import { celsiusToFahrenheit } from '@/lib/units'
import type { BlockFeature } from '@/lib/types'

const CSV_HEADER = [
  'block_id',
  'kids_est',
  'status_now',
  'status_rec',
  'coolest_mean_c',
  'coolest_mean_f',
  'dose',
  'days_exceedance_per_year',
  'reason',
]

function escapeCsvField(value: string | number): string {
  const text = String(value)
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export function buildReclassificationCsv(blocks: BlockFeature[], daysExceedancePerYear: number | null): string {
  const rows = blocks.map((block) => {
    const { properties } = block
    const meanF = celsiusToFahrenheit(properties.coolest.mean_c)
    return [
      properties.block_id,
      properties.kids_est,
      properties.status_now,
      properties.status_rec,
      properties.coolest.mean_c.toFixed(1),
      meanF.toFixed(1),
      properties.coolest.dose.toFixed(0),
      daysExceedancePerYear !== null ? daysExceedancePerYear.toFixed(1) : '',
      properties.reason,
    ]
      .map(escapeCsvField)
      .join(',')
  })

  return [CSV_HEADER.join(','), ...rows].join('\n')
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
