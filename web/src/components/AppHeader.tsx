import ModeSwitch from '@/components/ModeSwitch'
import ThemeToggle from '@/components/ThemeToggle'
import HideHeatToggle from '@/components/HideHeatToggle'

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-surface px-4">
      <span className="text-sm font-semibold tracking-tight">HeatWalk</span>
      <div className="flex items-center gap-4">
        <ModeSwitch />
        <HideHeatToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
