import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildGrayscaleStyle } from '@/lib/basemapStyle'
import { useMapInstance } from '@/hooks/useMapInstance'

const PMTILES_URL = '/heatwalk-aoi.pmtiles'
const AOI_CENTER: [number, number] = [-81.4502, 28.59445]
const AOI_ZOOM = 12.5

export default function MapRoot() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { setMap } = useMapInstance()

  useEffect(() => {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)

    if (containerRef.current && !mapRef.current) {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: buildGrayscaleStyle(PMTILES_URL),
        center: AOI_CENTER,
        zoom: AOI_ZOOM,
      })
      mapRef.current = map
      setMap(map)
    }

    return () => {
      maplibregl.removeProtocol('pmtiles')
      mapRef.current?.remove()
      mapRef.current = null
      setMap(null)
    }
  }, [setMap])

  return <div ref={containerRef} className="h-dvh w-full" />
}
