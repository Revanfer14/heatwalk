import { useEffect } from 'react'
import type { SchoolData } from '@/lib/schoolDataCache'

export function useDefaultHour(
  schoolData: SchoolData | null,
  hour: string | null,
  setHour: (hour: string) => void,
): void {
  useEffect(() => {
    if (hour === null && schoolData !== null) {
      setHour(schoolData.temps.meta.canonical_hour)
    }
  }, [hour, schoolData, setHour])
}
