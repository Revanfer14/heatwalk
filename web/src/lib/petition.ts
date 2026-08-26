import { formatDose, formatTemperaturePair } from '@/lib/units'
import type { BlockClass, School } from '@/lib/types'

interface PetitionStatute {
  stateName: string
  citation: string
}

const PETITION_STATUTES: Record<string, PetitionStatute> = {
  '12': {
    stateName: 'Florida',
    citation: 'Florida Statute §1006.21/§1006.23',
  },
}

function statuteForBlockId(blockId: string): PetitionStatute | null {
  const stateFips = blockId.slice(0, 2)
  return PETITION_STATUTES[stateFips] ?? null
}

export interface PetitionBlockContext {
  block_id: string
  class: BlockClass
  coolest: { mean_c: number; peak_c: number; dose: number }
  safe_until_hour: string | null
}

export interface PetitionInput {
  address: string
  school: School
  block: PetitionBlockContext
}

export function buildPetitionText(input: PetitionInput): string | null {
  const { address, school, block } = input
  if (block.class !== 'red') {
    return null
  }

  const statute = statuteForBlockId(block.block_id)
  if (statute === null) {
    return null
  }

  const meanPair = formatTemperaturePair(block.coolest.mean_c)
  const peakPair = formatTemperaturePair(block.coolest.peak_c)
  const dose = formatDose(block.coolest.dose)
  const safeUntilLine =
    block.safe_until_hour !== null
      ? `This route stays under the exposure threshold until ${block.safe_until_hour}.`
      : 'This route exceeds the exposure threshold from the first recorded hour.'

  return [
    `Address: ${address}`,
    `School: ${school.name}`,
    `Even the coolest available route averages ${meanPair}, peaking at ${peakPair}.`,
    `Cumulative heat dose on the coolest route: ${dose}.`,
    safeUntilLine,
    `Submitted under ${statute.citation}, the ${statute.stateName} hazardous walking condition provision.`,
  ].join('\n')
}
