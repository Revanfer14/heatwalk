import { useEffect, useState } from 'react'
import type { LiveTemperatureGrid } from '@/lib/liveTemperatureGrid'

export type LiveTemperatureStatus = 'idle' | 'starting' | 'polling' | 'live' | 'unavailable'

export interface LiveTemperatureResult {
  status: LiveTemperatureStatus
  liveMedianC: number | null
  grid: LiveTemperatureGrid | null
}

interface CachedLiveTemperature {
  medianC: number
  grid: LiveTemperatureGrid | null
}

const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 120000
const CACHE_KEY_PREFIX = 'heatwalk-live-grid'

function cacheKey(schoolId: string, hour: string): string {
  return `${CACHE_KEY_PREFIX}:${schoolId}:${hour}`
}

function readCachedResult(schoolId: string, hour: string): CachedLiveTemperature | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(schoolId, hour))
    return raw === null ? null : (JSON.parse(raw) as CachedLiveTemperature)
  } catch {
    return null
  }
}

function writeCachedResult(schoolId: string, hour: string, result: CachedLiveTemperature): void {
  try {
    sessionStorage.setItem(cacheKey(schoolId, hour), JSON.stringify(result))
  } catch {
    return
  }
}

async function pollUntilReady(
  activityId: string,
  schoolId: string,
  hour: string,
  isCancelled: () => boolean,
): Promise<CachedLiveTemperature> {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (!isCancelled() && Date.now() < deadline) {
    const resultResponse = await fetch(`/api/live-temperature-result?activityId=${activityId}`)
    if (!resultResponse.ok) throw new Error('live-temperature-result failed')
    const body = (await resultResponse.json()) as {
      state: string
      medianC?: number
      grid?: LiveTemperatureGrid
    }

    if (body.state === 'ready' && body.medianC !== undefined) {
      const result: CachedLiveTemperature = { medianC: body.medianC, grid: body.grid ?? null }
      writeCachedResult(schoolId, hour, result)
      return result
    }
    if (body.state === 'failed') throw new Error('fortyguard reported failure')

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('live temperature poll timed out')
}

export function useLiveTemperature(schoolId: string | null, hour: string | null): LiveTemperatureResult {
  const [status, setStatus] = useState<LiveTemperatureStatus>('idle')
  const [liveMedianC, setLiveMedianC] = useState<number | null>(null)
  const [grid, setGrid] = useState<LiveTemperatureGrid | null>(null)

  useEffect(() => {
    if (schoolId === null || hour === null) return

    const cached = readCachedResult(schoolId, hour)
    if (cached !== null) {
      setStatus('live')
      setLiveMedianC(cached.medianC)
      setGrid(cached.grid)
      return
    }

    let cancelled = false
    setStatus('starting')
    setLiveMedianC(null)
    setGrid(null)

    const run = async (): Promise<void> => {
      const startResponse = await fetch(`/api/live-temperature-start?schoolId=${schoolId}&hour=${hour}`)
      if (!startResponse.ok) throw new Error('live-temperature-start failed')
      const { activityId } = (await startResponse.json()) as { activityId: string }
      if (cancelled) return

      setStatus('polling')
      const result = await pollUntilReady(activityId, schoolId, hour, () => cancelled)
      if (!cancelled) {
        setLiveMedianC(result.medianC)
        setGrid(result.grid)
        setStatus('live')
      }
    }

    run().catch(() => {
      if (!cancelled) setStatus('unavailable')
    })

    return () => {
      cancelled = true
    }
  }, [schoolId, hour])

  return { status, liveMedianC, grid }
}
