import { createContext } from 'react'
import type maplibregl from 'maplibre-gl'

export interface MapInstanceContextValue {
  map: maplibregl.Map | null
  setMap: (map: maplibregl.Map | null) => void
}

export const MapInstanceContext = createContext<MapInstanceContextValue | null>(null)
