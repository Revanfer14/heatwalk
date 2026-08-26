import { useRef, type ReactNode } from 'react'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useElementSize } from '@/hooks/useElementSize'
import {
  useDistrictMapPadding,
  DISTRICT_LEFT_WIDTH_PX,
  DISTRICT_RIGHT_WIDTH_PX,
} from '@/hooks/useDistrictMapPadding'

interface DistrictLayoutProps {
  schoolList: ReactNode
  topStrip: ReactNode
  detailPanel: ReactNode
}

export default function DistrictLayout({ schoolList, topStrip, detailPanel }: DistrictLayoutProps) {
  const { map } = useMapInstance()
  const topStripRef = useRef<HTMLDivElement | null>(null)
  const { height: topStripHeight } = useElementSize(topStripRef)

  useDistrictMapPadding(map, topStripHeight)

  return (
    <>
      <aside
        className="fixed left-0 z-10 overflow-y-auto border-r border-border bg-surface"
        style={{ top: 48, bottom: 0, width: DISTRICT_LEFT_WIDTH_PX }}
      >
        {schoolList}
      </aside>

      <div
        ref={topStripRef}
        className="fixed z-10 border-b border-border bg-surface px-6 py-4"
        style={{ top: 48, left: DISTRICT_LEFT_WIDTH_PX, right: DISTRICT_RIGHT_WIDTH_PX }}
      >
        {topStrip}
      </div>

      <aside
        className="fixed right-0 z-10 overflow-y-auto border-l border-border bg-surface-raised"
        style={{ top: 48, bottom: 0, width: DISTRICT_RIGHT_WIDTH_PX }}
      >
        {detailPanel}
      </aside>
    </>
  )
}
