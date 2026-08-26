import type { School } from '@/lib/types'
import type { SchoolNational } from '@/lib/districtTypes'

export function resolveAnalyzedSchoolId(nationalSchool: SchoolNational, schools: School[]): string | null {
  const ncesId = nationalSchool.id.replace(/^nces_/, '')
  return schools.find((school) => school.nces_id === ncesId)?.id ?? null
}
