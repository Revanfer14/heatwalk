import { useState } from 'react'
import { Button } from '@/components/ui/button'
import TemperaturePair from '@/components/TemperaturePair'
import { buildPetitionText, type PetitionBlockContext } from '@/lib/petition'
import type { School } from '@/lib/types'

const COPIED_LABEL_DURATION_MS = 2000

interface PetitionButtonProps {
  address: string
  school: School
  block: PetitionBlockContext
  hideHeatData: boolean
}

export default function PetitionButton({ address, school, block, hideHeatData }: PetitionButtonProps) {
  const [copied, setCopied] = useState(false)
  const petitionText = buildPetitionText({ address, school, block })

  if (petitionText === null || hideHeatData) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(petitionText)
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_LABEL_DURATION_MS)
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="text-sm font-medium text-ink">
        Even the coolest route averages <TemperaturePair celsius={block.coolest.mean_c} />. This block is
        recommended for bus eligibility.
      </p>
      <Button variant="outline" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy as hazardous walking petition basis'}
      </Button>
    </div>
  )
}
