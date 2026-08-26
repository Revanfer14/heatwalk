import { formatDose, formatTemperaturePair } from '@/lib/units'
import type { BlockProperties, School } from '@/lib/types'

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

export interface PetitionInput {
  address: string
  school: School
  block: BlockProperties
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
      ? `Rute ini masih di bawah ambang paparan sampai pukul ${block.safe_until_hour}.`
      : 'Rute ini melewati ambang paparan sejak jam pertama yang tercatat.'

  return [
    `Alamat: ${address}`,
    `Sekolah: ${school.name}`,
    `Bahkan rute teradem yang tersedia rata-rata ${meanPair}, puncak ${peakPair}.`,
    `Dosis panas kumulatif rute teradem: ${dose}.`,
    safeUntilLine,
    `Diajukan berdasarkan ${statute.citation}, ketentuan hazardous walking condition negara bagian ${statute.stateName}.`,
  ].join('\n')
}
