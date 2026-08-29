import { Slider } from '@/components/ui/slider'
import { formatHourAmPm } from '@/lib/units'

interface HourSliderProps {
  hours: string[]
  hour: string
  onHourChange: (hour: string) => void
  label?: string
}

export default function HourSlider({ hours, hour, onHourChange, label }: HourSliderProps) {
  const activeIndex = Math.max(hours.indexOf(hour), 0)
  const lastIndex = hours.length - 1

  return (
    <div className="w-full">
      {label !== undefined && <p className="mb-1 text-xs font-medium text-ink-muted">{label}</p>}
      <p className="mb-2 text-center text-lg font-semibold tabular-nums text-ink">{formatHourAmPm(hour)}</p>
      <Slider
        min={0}
        max={lastIndex}
        step={1}
        value={[activeIndex]}
        valueText={formatHourAmPm(hour)}
        onValueChange={([index]) => onHourChange(hours[index])}
        aria-label="Hour"
      />
      <div className="relative mt-1 h-1 w-full">
        {hours.map((tickHour, index) => (
          <span
            key={tickHour}
            className="absolute top-0 h-1 w-px bg-border"
            style={{ left: `${(index / lastIndex) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-ink-subtle">
        <span>{formatHourAmPm(hours[0])}</span>
        {activeIndex !== 0 && activeIndex !== lastIndex && <span>{formatHourAmPm(hour)}</span>}
        <span>{formatHourAmPm(hours[lastIndex])}</span>
      </div>
    </div>
  )
}
