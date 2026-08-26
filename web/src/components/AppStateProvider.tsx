import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppStateContext, type AppStateContextValue, type PinPosition } from '@/lib/appStateContext'
import { useTheme } from '@/hooks/useTheme'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'
import type { School, Tile } from '@/lib/types'

const DEFAULT_PIN: PinPosition = { lon: SAMPLE_LOCATIONS[0].lon, lat: SAMPLE_LOCATIONS[0].lat }

export default function AppStateProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>([])
  const [tile, setTile] = useState<Tile | null>(null)
  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | null>(null)
  const [pin, setPin] = useState<PinPosition>(DEFAULT_PIN)
  const [hour, setHour] = useState<string | null>(null)
  const [hideHeatData, setHideHeatData] = useState(false)
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/data/schools.json').then((response) => response.json() as Promise<School[]>),
      fetch('/data/tiles.json').then((response) => response.json() as Promise<Tile[]>),
    ])
      .then(([schoolsResult, tilesResult]) => {
        if (cancelled) return
        setSchools(schoolsResult)
        setTile(tilesResult[0] ?? null)
        setSelectedSchoolIdState((current) => current ?? schoolsResult[0]?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled) setBootError(error instanceof Error ? error.message : 'Failed to load boot data')
      })
      .finally(() => {
        if (!cancelled) setBootLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedSchoolId = useCallback((schoolId: string) => {
    setSelectedSchoolIdState(schoolId)
    setHour(null)
  }, [])

  const value = useMemo<AppStateContextValue>(
    () => ({
      schools,
      tile,
      bootLoading,
      bootError,
      selectedSchoolId,
      setSelectedSchoolId,
      pin,
      setPin,
      hour,
      setHour,
      hideHeatData,
      setHideHeatData,
      theme,
      setTheme,
    }),
    [schools, tile, bootLoading, bootError, selectedSchoolId, setSelectedSchoolId, pin, hour, hideHeatData, theme, setTheme],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
