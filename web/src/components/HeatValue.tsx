import type { ReactNode } from 'react'
import { useAppState } from '@/hooks/useAppState'

interface HeatValueProps {
  children: ReactNode
}

export default function HeatValue({ children }: HeatValueProps) {
  const { hideHeatData } = useAppState()
  return <>{hideHeatData ? '—' : children}</>
}
