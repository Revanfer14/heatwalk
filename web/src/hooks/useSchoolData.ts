import { useEffect, useState } from 'react'
import { loadSchoolData, type SchoolData } from '@/lib/schoolDataCache'

interface UseSchoolDataResult {
  data: SchoolData | null
  loading: boolean
  error: string | null
}

export function useSchoolData(schoolId: string | null): UseSchoolDataResult {
  const [data, setData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (schoolId === null) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loadSchoolData(schoolId)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load school data')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId])

  return { data, loading, error }
}
