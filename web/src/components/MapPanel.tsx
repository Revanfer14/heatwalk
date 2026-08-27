import type { ReactNode, RefObject } from 'react'
import BottomSheet from '@/components/BottomSheet'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { PANEL_INSET_PX, PANEL_WIDTH_PX } from '@/lib/panelGeometry'

interface MapPanelProps {
  header: ReactNode
  footer?: ReactNode
  peek?: ReactNode
  collapsed?: boolean
  children: ReactNode
  panelRef?: RefObject<HTMLDivElement | null>
}

export default function MapPanel({ header, footer, peek, collapsed = false, children, panelRef }: MapPanelProps) {
  const isSidePanel = useIsSidePanelViewport()

  if (!isSidePanel) {
    return <BottomSheet ref={panelRef} peek={peek ?? header} expanded={children} />
  }

  if (collapsed) return null

  return (
    <section
      ref={panelRef}
      className="fixed z-panel flex flex-col overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
      style={{ left: PANEL_INSET_PX, top: PANEL_INSET_PX, bottom: PANEL_INSET_PX, width: PANEL_WIDTH_PX }}
    >
      {header}
      <div className="flex-1 overflow-y-auto">{children}</div>
      {footer}
    </section>
  )
}
