import type { ReactNode } from 'react'
import { PANEL_INSET_PX } from '@/lib/panelGeometry'

interface FloatingCardProps {
  top: number
  children: ReactNode
}

export default function FloatingCard({ top, children }: FloatingCardProps) {
  return (
    <div
      className="fixed inset-x-0 z-panel mx-auto w-full max-w-md rounded-lg border border-border bg-surface-raised p-3 shadow-lg"
      style={{ top, left: PANEL_INSET_PX, right: PANEL_INSET_PX }}
    >
      {children}
    </div>
  )
}
