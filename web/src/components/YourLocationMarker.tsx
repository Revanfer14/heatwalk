import { House } from 'lucide-react'

const PIN_WIDTH_PX = 28
const PIN_HEIGHT_PX = 36
const PIN_HEAD_CENTER_Y_PX = 14
const PIN_STROKE_WIDTH_PX = 1.5
const GLYPH_SIZE_PX = 16
const PIN_PATH = 'M14 0C6.268 0 0 6.268 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.268 21.732 0 14 0z'

export default function YourLocationMarker() {
  return (
    <div className="relative cursor-grab" style={{ width: PIN_WIDTH_PX, height: PIN_HEIGHT_PX }}>
      <svg width={PIN_WIDTH_PX} height={PIN_HEIGHT_PX} viewBox={`0 0 ${PIN_WIDTH_PX} ${PIN_HEIGHT_PX}`}>
        <path d={PIN_PATH} fill="var(--ink)" stroke="var(--bg)" strokeWidth={PIN_STROKE_WIDTH_PX} />
      </svg>
      <House
        size={GLYPH_SIZE_PX}
        strokeWidth={PIN_STROKE_WIDTH_PX}
        color="var(--bg)"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: PIN_HEAD_CENTER_Y_PX }}
      />
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-[4px] border border-border bg-bg px-1.5 py-0.5 text-xs font-medium text-ink">
        Your location
      </span>
    </div>
  )
}
