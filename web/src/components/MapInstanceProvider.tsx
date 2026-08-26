import { useMemo, useState, type ReactNode } from 'react'
import type maplibregl from 'maplibre-gl'
import { MapInstanceContext, type MapInstanceContextValue } from '@/lib/mapInstanceContext'

export default function MapInstanceProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  const value = useMemo<MapInstanceContextValue>(() => ({ map, setMap }), [map])

  return <MapInstanceContext.Provider value={value}>{children}</MapInstanceContext.Provider>
}
