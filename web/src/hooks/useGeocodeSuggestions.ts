import { useCallback, useEffect, useRef, useState } from 'react'
import { geocodeSuggestions, type GeocodeResult } from '@/lib/geocode'
import type { Tile } from '@/lib/types'

export type GeocodeStatus = 'idle' | 'loading' | 'not_found' | 'error' | 'success'

interface UseGeocodeSuggestionsResult {
  status: GeocodeStatus
  suggestions: GeocodeResult[]
  search: (query: string) => void
}

const DEBOUNCE_MS = 300

export function useGeocodeSuggestions(tile: Tile | null): UseGeocodeSuggestionsResult {
  const [status, setStatus] = useState<GeocodeStatus>('idle')
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<number | null>(null)

  const runSearch = useCallback(
    async (query: string): Promise<void> => {
      if (tile === null || query.trim().length === 0) {
        setSuggestions([])
        setStatus('idle')
        return
      }

      abortControllerRef.current?.abort()
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setStatus('loading')
      try {
        const results = await geocodeSuggestions(query, tile.bbox, abortController.signal)
        if (abortController.signal.aborted) return
        setSuggestions(results)
        setStatus(results.length === 0 ? 'not_found' : 'success')
      } catch {
        if (abortController.signal.aborted) return
        setSuggestions([])
        setStatus('error')
      }
    },
    [tile],
  )

  const search = useCallback(
    (query: string): void => {
      if (debounceTimeoutRef.current !== null) window.clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = window.setTimeout(() => {
        void runSearch(query)
      }, DEBOUNCE_MS)
    },
    [runSearch],
  )

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) window.clearTimeout(debounceTimeoutRef.current)
      abortControllerRef.current?.abort()
    }
  }, [])

  return { status, suggestions, search }
}
