import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildGrayscaleStyle } from '@/lib/basemapStyle'

const PMTILES_URL = '/heatwalk-aoi.pmtiles'
const PROVISIONAL_AOI_CENTER: [number, number] = [-112.085, 33.48]
const PROVISIONAL_AOI_ZOOM = 12.5

export default function MapRoot() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)

    if (containerRef.current && !mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: buildGrayscaleStyle(PMTILES_URL),
        center: PROVISIONAL_AOI_CENTER,
        zoom: PROVISIONAL_AOI_ZOOM,
      })
    }

    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  return <div ref={containerRef} className="h-dvh w-full" />
}
