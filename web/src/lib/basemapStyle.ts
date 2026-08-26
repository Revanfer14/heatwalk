import { layers, namedTheme } from 'protomaps-themes-base'
import type { StyleSpecification } from 'maplibre-gl'

const PMTILES_SOURCE_ID = 'heatwalk-aoi'

export function buildGrayscaleStyle(pmtilesUrl: string): StyleSpecification {
  const theme = namedTheme('grayscale')

  return {
    version: 8,
    glyphs: '/fonts/{fontstack}/{range}.pbf',
    sources: {
      [PMTILES_SOURCE_ID]: {
        type: 'vector',
        url: `pmtiles://${pmtilesUrl}`,
        attribution:
          '<a href="https://openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
      },
    },
    layers: layers(PMTILES_SOURCE_ID, theme, { lang: 'en' }),
  }
}
