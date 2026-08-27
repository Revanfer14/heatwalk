import { createContext } from 'react'
import type { School, Tile } from '@/lib/types'

export type ThemeMode = 'light' | 'dark'

export interface PinPosition {
  lon: number
  lat: number
}

export interface AppStateContextValue {
  schools: School[]
  tile: Tile | null
  bootLoading: boolean
  bootError: string | null
  selectedSchoolId: string | null
  setSelectedSchoolId: (schoolId: string) => void
  pin: PinPosition
  setPin: (pin: PinPosition) => void
  hour: string | null
  setHour: (hour: string) => void
  hideHeatData: boolean
  setHideHeatData: (hidden: boolean) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  panelCollapsed: boolean
  setPanelCollapsed: (collapsed: boolean) => void
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)
