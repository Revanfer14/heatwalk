import type { ReactNode } from 'react'

interface FieldLabelProps {
  htmlFor: string
  children: ReactNode
}

export default function FieldLabel({ htmlFor, children }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-muted">
      {children}
    </label>
  )
}
