import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import ModeSwitch from '@/components/ModeSwitch'
import HideHeatToggle from '@/components/HideHeatToggle'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/hooks/useAppState'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { PANEL_INSET_PX } from '@/lib/panelGeometry'

export default function FloatingControls() {
  const { panelCollapsed, setPanelCollapsed } = useAppState()
  const isSidePanel = useIsSidePanelViewport()

  return (
    <div
      className="fixed z-controls flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 shadow-lg"
      style={{ top: PANEL_INSET_PX, right: PANEL_INSET_PX }}
    >
      {isSidePanel && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={panelCollapsed ? 'Show panel' : 'Hide panel'}
          onClick={() => setPanelCollapsed(!panelCollapsed)}
        >
          {panelCollapsed ? (
            <PanelLeftOpen strokeWidth={1.5} size={16} />
          ) : (
            <PanelLeftClose strokeWidth={1.5} size={16} />
          )}
        </Button>
      )}
      <ModeSwitch />
      <HideHeatToggle />
      <ThemeToggle />
    </div>
  )
}
