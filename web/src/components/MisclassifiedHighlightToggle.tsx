import HeatValue from '@/components/HeatValue'
import { Switch } from '@/components/ui/switch'

interface MisclassifiedHighlightToggleProps {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
  hideHeatData: boolean
}

export default function MisclassifiedHighlightToggle({
  label,
  count,
  checked,
  onToggle,
  hideHeatData,
}: MisclassifiedHighlightToggleProps) {
  const disabled = hideHeatData || count === 0

  return (
    <label
      className="flex items-center justify-between gap-3 data-disabled:opacity-50"
      data-disabled={disabled ? '' : undefined}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-ink-subtle">{label}</span>
        <span className="text-base tabular-nums text-ink">
          <HeatValue>{count}</HeatValue>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onToggle} aria-label={label} disabled={disabled} />
    </label>
  )
}
