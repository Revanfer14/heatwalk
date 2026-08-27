import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useNavigate } from 'react-router-dom'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASEMAP_ATTRIBUTION_HTML, BASEMAP_STYLE_URL } from '@/lib/basemapStyle'
import { useMapInstance } from '@/hooks/useMapInstance'
import { DOC_LINKS_ATTRIBUTION_HTML, DOC_ROUTE_ATTRIBUTE } from '@/lib/docLinksAttribution'

const AOI_CENTER: [number, number] = [-81.4502, 28.59445]
const AOI_ZOOM = 12.5

function createAoiMap(container: HTMLDivElement): maplibregl.Map {
  return new maplibregl.Map({
    container,
    style: BASEMAP_STYLE_URL,
    center: AOI_CENTER,
    zoom: AOI_ZOOM,
    attributionControl: {
      compact: true,
      customAttribution: [DOC_LINKS_ATTRIBUTION_HTML, BASEMAP_ATTRIBUTION_HTML],
    },
  })
}

export default function MapRoot() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { setMap } = useMapInstance()
  const navigate = useNavigate()

  useEffect(() => {
    const container = containerRef.current
    const map = container !== null && mapRef.current === null ? createAoiMap(container) : null
    const publishStyleLoadedMap = (): void => {
      if (map !== null) setMap(map)
    }
    const reportBasemapError = (event: maplibregl.ErrorEvent): void => {
      console.error('HeatWalk basemap failed to load', event.error)
    }

    if (map !== null) {
      mapRef.current = map
      map.on('load', publishStyleLoadedMap)
      map.on('error', reportBasemapError)
    }

    return () => {
      map?.off('load', publishStyleLoadedMap)
      map?.off('error', reportBasemapError)
      mapRef.current?.remove()
      mapRef.current = null
      setMap(null)
    }
  }, [setMap])

  useEffect(() => {
    const container = containerRef.current
    if (container === null) return

    const handleClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement
      const link = target.closest(`a[${DOC_ROUTE_ATTRIBUTE}]`)
      if (link === null) return
      event.preventDefault()
      navigate(link.getAttribute(DOC_ROUTE_ATTRIBUTE) ?? '/')
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [navigate])

  return <div ref={containerRef} className="h-dvh w-full" />
}
