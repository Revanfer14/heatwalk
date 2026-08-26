interface SafeUntilLineProps {
  safeUntilHour: string | null
}

export default function SafeUntilLine({ safeUntilHour }: SafeUntilLineProps) {
  if (safeUntilHour === null) return null

  return <p className="text-sm font-medium text-ink">Safe if picked up before {safeUntilHour}.</p>
}
