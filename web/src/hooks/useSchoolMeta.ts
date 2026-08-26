import { useEffect, useState } from 'react'
import { loadSchoolMeta } from '@/lib/schoolMetaCache'
import type { TempsMeta } from '@/lib/types'

interface UseSchoolMetaResult {
  meta: TempsMeta | null
  loading: boolean
  error: string | null
}

export function useSchoolMeta(schoolId: string | null): UseSchoolMetaResult {
  const [meta, setMeta] = useState<TempsMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (schoolId === null) {
      setMeta(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loadSchoolMeta(schoolId)
      .then((result) => {
        if (!cancelled) setMeta(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load school parameters')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId])

  return { meta, loading, error }
}
