import type { CatenaXPartner } from '@/types/Infrastructure'

export function normalizeCatenaXPartner (
  partner: Partial<CatenaXPartner>,
): CatenaXPartner | null {
  const counterPartyId = normalizeText(partner.counterPartyId)
  const counterPartyAddress = normalizeText(partner.counterPartyAddress)
  if (counterPartyId === '' || counterPartyAddress === '') {
    return null
  }

  return {
    id: normalizeText(partner.id) || createCatenaXPartnerId(counterPartyId, counterPartyAddress),
    name: normalizeText(partner.name) || undefined,
    counterPartyId,
    counterPartyAddress,
  }
}

export function normalizeCatenaXPartners (partners: unknown): CatenaXPartner[] {
  if (!Array.isArray(partners)) {
    return []
  }

  const partnersByKey = new Map<string, CatenaXPartner>()
  for (const partner of partners) {
    const normalizedPartner = normalizeCatenaXPartner(partner as Partial<CatenaXPartner>)
    if (!normalizedPartner) {
      continue
    }

    partnersByKey.set(getCatenaXPartnerKey(normalizedPartner), normalizedPartner)
  }

  return Array.from(partnersByKey.values())
}

export function mergeCatenaXPartners (
  configuredPartners: CatenaXPartner[],
  recentPartners: CatenaXPartner[],
): CatenaXPartner[] {
  const configured = normalizeCatenaXPartners(configuredPartners)
  const configuredKeys = new Set(configured.map(partner => getCatenaXPartnerKey(partner)))
  const recent = normalizeCatenaXPartners(recentPartners)
    .filter(partner => !configuredKeys.has(getCatenaXPartnerKey(partner)))

  return [...configured, ...recent]
}

export function createCatenaXPartnerId (
  counterPartyId: string,
  counterPartyAddress: string,
  existingIds: string[] = [],
): string {
  const baseId = `${counterPartyId}-${counterPartyAddress}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'partner'
  const usedIds = new Set(existingIds.map(id => id.trim()).filter(Boolean))

  if (!usedIds.has(baseId)) {
    return baseId
  }

  let suffix = 2
  while (usedIds.has(`${baseId}-${suffix}`)) {
    suffix += 1
  }

  return `${baseId}-${suffix}`
}

export function getCatenaXPartnerKey (
  partner: Pick<CatenaXPartner, 'counterPartyId' | 'counterPartyAddress'>,
): string {
  return `${partner.counterPartyId.trim()}::${canonicalizeCatenaXPartnerAddress(partner.counterPartyAddress)}`
}

export function canonicalizeCatenaXPartnerAddress (value: string): string {
  const trimmedValue = value.trim()

  try {
    const url = new URL(trimmedValue)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return trimmedValue
    }

    url.hash = ''
    url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString().replace(/\/$/, '')
  } catch {
    return trimmedValue
  }
}

export function isValidCatenaXPartnerAddress (value: string): boolean {
  try {
    const url = new URL(value.trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== ''
  } catch {
    return false
  }
}

function normalizeText (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
