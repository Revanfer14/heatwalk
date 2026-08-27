import { useEffect, useState } from 'react'
import { loadDistrictBlocks, loadDistrictBlocksHours } from '@/lib/districtDataCache'
import type { BlocksGeoJson } from '@/lib/types'
import type { BlocksHours } from '@/lib/districtTypes'

interface DistrictBlocksState {
  districtBlocks: BlocksGeoJson | null
  districtBlocksHours: BlocksHours | null
  loading: boolean
  error: Error | null
}

const INITIAL_STATE: DistrictBlocksState = {
  districtBlocks: null,
  districtBlocksHours: null,
  loading: true,
  error: null,
}

export function useDistrictBlocks(): DistrictBlocksState {
  const [state, setState] = useState<DistrictBlocksState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false

    Promise.all([loadDistrictBlocks(), loadDistrictBlocksHours()])
      .then(([districtBlocks, districtBlocksHours]) => {
        if (cancelled) return
        setState({ districtBlocks, districtBlocksHours, loading: false, error: null })
      })
      .catch((error: Error) => {
        if (cancelled) return
        setState((previous) => ({ ...previous, loading: false, error }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
