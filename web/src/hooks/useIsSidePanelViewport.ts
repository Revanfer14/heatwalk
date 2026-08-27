import { useEffect, useState } from 'react'
import { SIDE_PANEL_MIN_VIEWPORT_PX } from '@/lib/panelGeometry'

export function useIsSidePanelViewport(): boolean {
  const query = `(min-width: ${SIDE_PANEL_MIN_VIEWPORT_PX}px)`
  const [isSidePanel, setIsSidePanel] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent): void => setIsSidePanel(event.matches)
    mediaQueryList.addEventListener('change', handleChange)
    setIsSidePanel(mediaQueryList.matches)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [query])

  return isSidePanel
}
