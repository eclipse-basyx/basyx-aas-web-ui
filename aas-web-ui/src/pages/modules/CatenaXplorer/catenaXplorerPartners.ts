import type { CatenaXPartner } from '@/types/Infrastructure'

const storageKeyPrefix = 'catenaXplorerRecentPartners:'
const maxRecentPartners = 8

function normalizeText (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function createPartnerId (counterPartyId: string, counterPartyAddress: string): string {
  return `${counterPartyId}-${counterPartyAddress}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizePartner (partner: Partial<CatenaXPartner>): CatenaXPartner | null {
  const counterPartyId = normalizeText(partner.counterPartyId)
  const counterPartyAddress = normalizeText(partner.counterPartyAddress)
  if (counterPartyId === '' || counterPartyAddress === '') {
    return null
  }

  return {
    id: normalizeText(partner.id) || createPartnerId(counterPartyId, counterPartyAddress),
    name: normalizeText(partner.name) || undefined,
    counterPartyId,
    counterPartyAddress,
  }
}

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

export function normalizePartners (partners: unknown): CatenaXPartner[] {
  if (!Array.isArray(partners)) {
    return []
  }

  const uniquePartners = new Map<string, CatenaXPartner>()
  for (const partner of partners) {
    const normalizedPartner = normalizePartner(partner as Partial<CatenaXPartner>)
    if (!normalizedPartner) {
      continue
    }

    uniquePartners.set(
      `${normalizedPartner.counterPartyId}::${normalizedPartner.counterPartyAddress}`,
      normalizedPartner,
    )
  }

  return Array.from(uniquePartners.values())
}

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
  const normalizedPartner = normalizePartner(partner)
  if (proxyId.trim() === '' || !normalizedPartner) {
    return null
  }

  const existingPartners = readRecentPartnersFromStorage(proxyId)
  const recentPartners = [
    normalizedPartner,
    ...existingPartners.filter(existingPartner =>
      existingPartner.counterPartyId !== normalizedPartner.counterPartyId
      || existingPartner.counterPartyAddress !== normalizedPartner.counterPartyAddress,
    ),
  ]

  writeRecentPartnersToStorage(proxyId, recentPartners)
  return normalizedPartner
}
