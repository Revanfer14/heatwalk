import { polygonCentroid } from '@/lib/polygonCentroid'
import { formatCelsius } from '@/lib/units'
import type { BlocksGeoJson } from '@/lib/types'
import type { LonLat } from '@/lib/geoDistance'

export interface BlockTempLabelFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: LonLat }
  properties: { block_id: string; temp_label: string }
}

export interface BlockTempLabelsGeoJson {
  type: 'FeatureCollection'
  features: BlockTempLabelFeature[]
}

const EMPTY_LABELS: BlockTempLabelsGeoJson = { type: 'FeatureCollection', features: [] }

export function buildBlockTempLabels(blocks: BlocksGeoJson | null): BlockTempLabelsGeoJson {
  if (blocks === null) return EMPTY_LABELS

  const features: BlockTempLabelFeature[] = blocks.features.map((feature) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: polygonCentroid(feature.geometry) },
    properties: {
      block_id: feature.properties.block_id,
      temp_label: feature.properties.temp_label ?? formatCelsius(feature.properties.shortest.mean_c),
    },
  }))
  return { type: 'FeatureCollection', features }
}
