import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { LEGEND_ATTRIBUTION_CLEARANCE_PX, LEGEND_WIDTH_PX, PANEL_INSET_PX } from '@/lib/panelGeometry'
import { cn } from '@/lib/utils'

interface MapLegendProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  children: ReactNode
}

export default function MapLegend({ collapsed, onToggleCollapsed, children }: MapLegendProps) {
  return (
    <section
      className="fixed z-controls flex max-h-[70vh] flex-col overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
      style={{
        right: PANEL_INSET_PX,
        bottom: PANEL_INSET_PX + LEGEND_ATTRIBUTION_CLEARANCE_PX,
        width: LEGEND_WIDTH_PX,
      }}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show legend' : 'Hide legend'}
        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-ink"
      >
        Legend
        {collapsed ? <ChevronDown strokeWidth={1.5} size={16} /> : <ChevronUp strokeWidth={1.5} size={16} />}
      </button>
      <div
        className={cn(
          'overflow-y-auto px-3 pb-3 transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[60vh] opacity-100',
        )}
      >
        {children}
      </div>
    </section>
  )
}
