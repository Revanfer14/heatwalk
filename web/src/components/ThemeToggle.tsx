import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/hooks/useAppState'

export default function ThemeToggle() {
  const { theme, setTheme } = useAppState()
  const nextTheme = theme === 'light' ? 'dark' : 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
    >
      {theme === 'light' ? <Moon strokeWidth={1.5} size={16} /> : <Sun strokeWidth={1.5} size={16} />}
    </Button>
  )
}
