import { useContext } from 'react'
import { AppStateContext } from '@/lib/appStateContext'

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === null) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
