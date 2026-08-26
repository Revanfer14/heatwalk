import { useEffect, useState } from 'react'
import { loadBlocksHours } from '@/lib/districtDataCache'
import type { BlocksHours } from '@/lib/districtTypes'

interface UseBlocksHoursResult {
  blocksHours: BlocksHours | null
  loading: boolean
  error: string | null
}

export function useBlocksHours(schoolId: string | null): UseBlocksHoursResult {
  const [blocksHours, setBlocksHours] = useState<BlocksHours | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (schoolId === null) {
      setBlocksHours(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loadBlocksHours(schoolId)
      .then((result) => {
        if (!cancelled) setBlocksHours(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load blocks_hours')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId])

  return { blocksHours, loading, error }
}
