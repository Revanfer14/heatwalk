import { Switch } from '@/components/ui/switch'
import type { LayerVisibility } from '@/lib/districtStateContext'

interface LayerTogglesProps {
  layerVisibility: LayerVisibility
  onToggle: (layer: keyof LayerVisibility) => void
}

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  officialZone: 'Official walk zone',
  doseZone: 'Heat dose zone',
  doseRadius: 'Dose-equivalent radius',
}

const LAYER_KEYS = Object.keys(LAYER_LABELS) as Array<keyof LayerVisibility>

export default function LayerToggles({ layerVisibility, onToggle }: LayerTogglesProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {LAYER_KEYS.map((layer) => (
        <label key={layer} className="flex items-center gap-2 text-xs text-ink-muted">
          <Switch
            checked={layerVisibility[layer]}
            onCheckedChange={() => onToggle(layer)}
            aria-label={LAYER_LABELS[layer]}
          />
          {LAYER_LABELS[layer]}
        </label>
      ))}
    </div>
  )
}
