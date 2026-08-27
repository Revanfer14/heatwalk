import type { ReactNode } from 'react'

interface MapPanelFooterProps {
  children: ReactNode
}

export default function MapPanelFooter({ children }: MapPanelFooterProps) {
  return <div className="border-t border-border px-4 py-2.5 text-xs text-ink-subtle">{children}</div>
}
