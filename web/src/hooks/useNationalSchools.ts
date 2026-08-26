import { useEffect, useState } from 'react'
import { loadNationalSchools } from '@/lib/nationalSchoolsCache'
import type { SchoolNational } from '@/lib/districtTypes'

interface UseNationalSchoolsResult {
  schools: SchoolNational[] | null
  loading: boolean
  error: string | null
}

export function useNationalSchools(): UseNationalSchoolsResult {
  const [schools, setSchools] = useState<SchoolNational[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadNationalSchools()
      .then((result) => {
        if (!cancelled) setSchools(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load national schools')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { schools, loading, error }
}
