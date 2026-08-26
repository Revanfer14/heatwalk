import { useEffect, useState } from 'react'
import { loadSegmentPriority } from '@/lib/districtDataCache'
import type { SegmentPriorityRow } from '@/lib/districtTypes'

interface UseSegmentPriorityResult {
  segments: SegmentPriorityRow[] | null
  loading: boolean
  error: string | null
}

export function useSegmentPriority(schoolId: string | null): UseSegmentPriorityResult {
  const [segments, setSegments] = useState<SegmentPriorityRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (schoolId === null) {
      setSegments(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loadSegmentPriority(schoolId)
      .then((result) => {
        if (!cancelled) setSegments(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load segments')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId])

  return { segments, loading, error }
}
