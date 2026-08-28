import { useCallback, useRef } from 'react'
import { reverseGeocode } from '@/lib/geocode'
import { formatPinCoordinates } from '@/lib/units'
import type { PinPosition } from '@/lib/appStateContext'

export function useOriginAddressSync(setAddressText: (text: string) => void): (pin: PinPosition) => void {
  const latestRequestRef = useRef(0)

  return useCallback(
    (pin: PinPosition): void => {
      const requestId = latestRequestRef.current + 1
      latestRequestRef.current = requestId
      setAddressText(formatPinCoordinates(pin.lon, pin.lat))

      reverseGeocode(pin.lon, pin.lat)
        .then((result) => {
          if (latestRequestRef.current !== requestId) return
          if (result !== null) setAddressText(result.displayName)
        })
        .catch(() => {
          if (latestRequestRef.current === requestId) setAddressText(formatPinCoordinates(pin.lon, pin.lat))
        })
    },
    [setAddressText],
  )
}
