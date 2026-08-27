import type maplibregl from 'maplibre-gl'
import type { RouteColors } from '@/lib/mapPaint'

export const SCHOOL_PIN_IMAGE_ID = 'heatwalk-school-pin'
export const SCHOOL_PIN_MUTED_IMAGE_ID = 'heatwalk-school-pin-muted'

const CHIP_SIZE_PX = 28
const CHIP_RADIUS_PX = 4
const CHIP_BORDER_WIDTH_PX = 1.5
const GLYPH_VIEWBOX_PX = 24
const GLYPH_SIZE_PX = 16
const PIXEL_RATIO = 2

const GRADUATION_CAP_PATHS = [
  'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
  'M22 10v6',
  'M6 12.5V16a6 3 0 0 0 12 0v-3.5',
]

function drawSchoolPinImageData(chipColor: string, borderColor: string, glyphColor: string): ImageData | null {
  const canvas = document.createElement('canvas')
  canvas.width = CHIP_SIZE_PX * PIXEL_RATIO
  canvas.height = CHIP_SIZE_PX * PIXEL_RATIO
  const context = canvas.getContext('2d')
  if (context === null) return null

  context.scale(PIXEL_RATIO, PIXEL_RATIO)

  const inset = CHIP_BORDER_WIDTH_PX / 2
  context.fillStyle = chipColor
  context.strokeStyle = borderColor
  context.lineWidth = CHIP_BORDER_WIDTH_PX
  context.beginPath()
  context.roundRect(inset, inset, CHIP_SIZE_PX - inset * 2, CHIP_SIZE_PX - inset * 2, CHIP_RADIUS_PX)
  context.fill()
  context.stroke()

  const glyphScale = GLYPH_SIZE_PX / GLYPH_VIEWBOX_PX
  context.save()
  context.translate(CHIP_SIZE_PX / 2, CHIP_SIZE_PX / 2)
  context.scale(glyphScale, glyphScale)
  context.translate(-GLYPH_VIEWBOX_PX / 2, -GLYPH_VIEWBOX_PX / 2)
  context.strokeStyle = glyphColor
  context.lineWidth = CHIP_BORDER_WIDTH_PX / glyphScale
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (const pathData of GRADUATION_CAP_PATHS) {
    context.stroke(new Path2D(pathData))
  }
  context.restore()

  return context.getImageData(0, 0, canvas.width, canvas.height)
}

function addOrReplaceImage(map: maplibregl.Map, id: string, imageData: ImageData | null): void {
  if (imageData === null) return
  if (map.hasImage(id)) {
    map.updateImage(id, imageData)
  } else {
    map.addImage(id, imageData, { pixelRatio: PIXEL_RATIO })
  }
}

export function registerSchoolPinImages(map: maplibregl.Map, colors: RouteColors): void {
  addOrReplaceImage(map, SCHOOL_PIN_IMAGE_ID, drawSchoolPinImageData(colors.bg, colors.ink, colors.ink))
  addOrReplaceImage(
    map,
    SCHOOL_PIN_MUTED_IMAGE_ID,
    drawSchoolPinImageData(colors.bg, colors.inkSubtle, colors.inkSubtle),
  )
}
