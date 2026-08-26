import { Switch } from '@/components/ui/switch'
import { useAppState } from '@/hooks/useAppState'

export default function HideHeatToggle() {
  const { hideHeatData, setHideHeatData } = useAppState()

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <span className="hidden sm:inline">Hide heat data</span>
      <Switch checked={hideHeatData} onCheckedChange={setHideHeatData} aria-label="Hide heat data" />
    </label>
  )
}
