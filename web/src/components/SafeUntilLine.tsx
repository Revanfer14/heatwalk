import { useAppState } from '@/hooks/useAppState'

interface SafeUntilLineProps {
  safeUntilHour: string | null
}

export default function SafeUntilLine({ safeUntilHour }: SafeUntilLineProps) {
  const { hideHeatData } = useAppState()
  if (safeUntilHour === null || hideHeatData) return null

  return <p className="text-sm font-medium text-ink">Safe if picked up before {safeUntilHour}.</p>
}
