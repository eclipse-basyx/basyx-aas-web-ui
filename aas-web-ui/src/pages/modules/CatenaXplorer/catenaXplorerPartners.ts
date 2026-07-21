import type { CatenaXPartner } from '@/types/Infrastructure'
import {
  getCatenaXPartnerKey,
  normalizeCatenaXPartner,
  normalizeCatenaXPartners,
} from '@/utils/CatenaXPartnerUtils'

const storageKeyPrefix = 'catenaXplorerRecentPartners:'
const maxRecentPartners = 8

function getStorageKey (proxyId: string): string {
  return `${storageKeyPrefix}${proxyId.trim()}`
}

function readRecentPartnersFromStorage (proxyId: string): CatenaXPartner[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(getStorageKey(proxyId))
    if (!storedValue) {
      return []
    }

    return normalizePartners(JSON.parse(storedValue))
  } catch {
    return []
  }
}

function writeRecentPartnersToStorage (proxyId: string, partners: CatenaXPartner[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getStorageKey(proxyId), JSON.stringify(partners.slice(0, maxRecentPartners)))
}

export const normalizePartners = normalizeCatenaXPartners

export function getRecentCatenaXPartners (proxyId: string): CatenaXPartner[] {
  if (proxyId.trim() === '') {
    return []
  }

  return readRecentPartnersFromStorage(proxyId)
}

export function rememberRecentCatenaXPartner (
  proxyId: string,
  partner: Partial<CatenaXPartner>,
): CatenaXPartner | null {
  const normalizedPartner = normalizeCatenaXPartner(partner)
  if (proxyId.trim() === '' || !normalizedPartner) {
    return null
  }

  const existingPartners = readRecentPartnersFromStorage(proxyId)
  const partnerKey = getCatenaXPartnerKey(normalizedPartner)
  const recentPartners = [
    normalizedPartner,
    ...existingPartners.filter(existingPartner => getCatenaXPartnerKey(existingPartner) !== partnerKey),
  ]

  writeRecentPartnersToStorage(proxyId, recentPartners)
  return normalizedPartner
}

export function forgetRecentCatenaXPartner (
  proxyId: string,
  partner: Pick<CatenaXPartner, 'counterPartyId' | 'counterPartyAddress'>,
): void {
  if (proxyId.trim() === '') {
    return
  }

  const partnerKey = getCatenaXPartnerKey(partner)
  const recentPartners = readRecentPartnersFromStorage(proxyId)
    .filter(existingPartner => getCatenaXPartnerKey(existingPartner) !== partnerKey)
  writeRecentPartnersToStorage(proxyId, recentPartners)
}
