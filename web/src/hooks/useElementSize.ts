import { useEffect, useState, type RefObject } from 'react'

interface ElementSize {
  width: number
  height: number
}

export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry === undefined) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return size
}
