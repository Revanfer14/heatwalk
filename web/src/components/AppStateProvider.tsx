import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppStateContext, type AppStateContextValue, type PinPosition } from '@/lib/appStateContext'
import { useTheme } from '@/hooks/useTheme'
import { useMapInstance } from '@/hooks/useMapInstance'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'
import type { School, Tile } from '@/lib/types'

const DEFAULT_PIN: PinPosition = { lon: SAMPLE_LOCATIONS[0].lon, lat: SAMPLE_LOCATIONS[0].lat }
const MAP_READY_FALLBACK_MS = 3000

export default function AppStateProvider({ children }: { children: ReactNode }) {
  const { map } = useMapInstance()
  const [schools, setSchools] = useState<School[]>([])
  const [tile, setTile] = useState<Tile | null>(null)
  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | null>(null)
  const [pin, setPin] = useState<PinPosition>(DEFAULT_PIN)
  const [hour, setHour] = useState<string | null>(null)
  const [hideHeatData, setHideHeatData] = useState(false)
  const [theme, setTheme] = useTheme()
  const [panelCollapsed, setPanelCollapsed] = useState(false)

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
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : 'Failed to load boot data')
          setBootLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (schools.length === 0) return

    const selectFirstSchool = (): void => {
      setSelectedSchoolIdState((current) => current ?? schools[0]?.id ?? null)
      setBootLoading(false)
    }

    if (map !== null) {
      selectFirstSchool()
      return
    }

    const fallbackTimeoutId = window.setTimeout(selectFirstSchool, MAP_READY_FALLBACK_MS)
    return () => window.clearTimeout(fallbackTimeoutId)
  }, [map, schools])

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
      panelCollapsed,
      setPanelCollapsed,
    }),
    [
      schools,
      tile,
      bootLoading,
      bootError,
      selectedSchoolId,
      setSelectedSchoolId,
      pin,
      hour,
      hideHeatData,
      theme,
      setTheme,
      panelCollapsed,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
