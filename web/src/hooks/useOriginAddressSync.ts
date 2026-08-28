import { useCallback } from 'react'
import { reverseGeocode } from '@/lib/geocode'
import type { PinPosition } from '@/lib/appStateContext'

export function useOriginAddressSync(setAddressText: (text: string) => void): (pin: PinPosition) => void {
  return useCallback(
    (pin: PinPosition) => {
      reverseGeocode(pin.lon, pin.lat)
        .then((result) => {
          if (result !== null) setAddressText(result.displayName)
        })
        .catch(() => undefined)
    },
    [setAddressText],
  )
}
