import { Switch } from '@/components/ui/switch'
import type { LayerVisibility } from '@/lib/districtStateContext'

interface LayerTogglesProps {
  layerVisibility: LayerVisibility
  onToggle: (layer: keyof LayerVisibility) => void
  hideHeatData: boolean
}

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  officialZone: 'Official walk zone',
  doseZone: 'Heat dose zone',
  doseRadius: 'Dose-equivalent radius',
}

const HEAT_DERIVED_LAYERS: Array<keyof LayerVisibility> = ['doseZone', 'doseRadius']

const LAYER_KEYS = Object.keys(LAYER_LABELS) as Array<keyof LayerVisibility>

export default function LayerToggles({ layerVisibility, onToggle, hideHeatData }: LayerTogglesProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {LAYER_KEYS.map((layer) => {
        const disabled = hideHeatData && HEAT_DERIVED_LAYERS.includes(layer)
        return (
          <label
            key={layer}
            className="flex items-center gap-2 text-xs text-ink-muted data-disabled:opacity-50"
            data-disabled={disabled ? '' : undefined}
          >
            <Switch
              checked={layerVisibility[layer]}
              onCheckedChange={() => onToggle(layer)}
              aria-label={LAYER_LABELS[layer]}
              disabled={disabled}
            />
            {LAYER_LABELS[layer]}
          </label>
        )
      })}
    </div>
  )
}
