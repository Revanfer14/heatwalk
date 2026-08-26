import type maplibregl from 'maplibre-gl'

export const HATCH_PATTERN_ID = 'heatwalk-hatch-red'

const PATTERN_SIZE_PX = 8
const STROKE_WIDTH_PX = 1.5

export function registerHatchPattern(map: maplibregl.Map, colorHex: string): void {
  const canvas = document.createElement('canvas')
  canvas.width = PATTERN_SIZE_PX
  canvas.height = PATTERN_SIZE_PX
  const context = canvas.getContext('2d')
  if (context === null) return

  context.strokeStyle = colorHex
  context.lineWidth = STROKE_WIDTH_PX
  context.beginPath()
  context.moveTo(0, PATTERN_SIZE_PX)
  context.lineTo(PATTERN_SIZE_PX, 0)
  context.moveTo(-PATTERN_SIZE_PX / 2, PATTERN_SIZE_PX / 2)
  context.lineTo(PATTERN_SIZE_PX / 2, -PATTERN_SIZE_PX / 2)
  context.moveTo(PATTERN_SIZE_PX / 2, PATTERN_SIZE_PX * 1.5)
  context.lineTo(PATTERN_SIZE_PX * 1.5, PATTERN_SIZE_PX / 2)
  context.stroke()

  const imageData = context.getImageData(0, 0, PATTERN_SIZE_PX, PATTERN_SIZE_PX)
  if (map.hasImage(HATCH_PATTERN_ID)) map.removeImage(HATCH_PATTERN_ID)
  map.addImage(HATCH_PATTERN_ID, imageData)
}
