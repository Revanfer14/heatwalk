import { useEffect, useState } from 'react'
import type { SummaryBySchool } from '@/lib/types'

interface UseSummaryResult {
  summary: SummaryBySchool | null
  loading: boolean
  error: string | null
}

export function useSummary(): UseSummaryResult {
  const [summary, setSummary] = useState<SummaryBySchool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/data/summary.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch summary.json: ${response.status}`)
        return response.json() as Promise<SummaryBySchool>
      })
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : 'Failed to load summary')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { summary, loading, error }
}
