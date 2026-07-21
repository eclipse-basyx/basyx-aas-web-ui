import { describe, expect, it } from 'vitest'
import {
  canonicalizeCatenaXPartnerAddress,
  createCatenaXPartnerId,
  getCatenaXPartnerKey,
  isValidCatenaXPartnerAddress,
  mergeCatenaXPartners,
  normalizeCatenaXPartners,
} from '@/utils/CatenaXPartnerUtils'

describe('CatenaXPartnerUtils.ts', () => {
  it('normalizes and de-duplicates partners by counterparty and address', () => {
    expect(normalizeCatenaXPartners([
      {
        id: 'first',
        counterPartyId: ' BPNL0001 ',
        counterPartyAddress: ' https://partner.example/dsp ',
      },
      {
        id: 'second',
        name: 'Partner',
        counterPartyId: 'BPNL0001',
        counterPartyAddress: 'https://partner.example/dsp',
      },
    ])).toEqual([{
      id: 'second',
      name: 'Partner',
      counterPartyId: 'BPNL0001',
      counterPartyAddress: 'https://partner.example/dsp',
    }])
  })

  it('keeps configured partner metadata ahead of matching recent entries', () => {
    const configured = [{
      id: 'configured-id',
      name: 'Configured Partner',
      counterPartyId: 'BPNL0001',
      counterPartyAddress: 'https://partner.example/dsp',
    }]
    const recent = [{
      id: 'recent-id',
      counterPartyId: 'BPNL0001',
      counterPartyAddress: 'https://partner.example/dsp',
    }]

    expect(mergeCatenaXPartners(configured, recent)).toEqual(configured)
  })

  it('uses a canonical URL for duplicate comparison without changing stored addresses', () => {
    expect(canonicalizeCatenaXPartnerAddress(' HTTPS://PARTNER.EXAMPLE:443/dsp/ '))
      .toBe('https://partner.example/dsp')
    expect(getCatenaXPartnerKey({
      counterPartyId: 'BPNL0001',
      counterPartyAddress: 'https://PARTNER.example:443/dsp/',
    })).toBe('BPNL0001::https://partner.example/dsp')
    expect(normalizeCatenaXPartners([{
      id: 'configured',
      counterPartyId: 'BPNL0001',
      counterPartyAddress: 'https://PARTNER.example:443/dsp/',
    }])[0]?.counterPartyAddress).toBe('https://PARTNER.example:443/dsp/')
  })

  it('creates collision-safe IDs and accepts only absolute HTTP addresses', () => {
    const baseId = createCatenaXPartnerId('BPNL0001', 'https://partner.example/dsp')

    expect(createCatenaXPartnerId('BPNL0001', 'https://partner.example/dsp', [baseId])).toBe(`${baseId}-2`)
    expect(isValidCatenaXPartnerAddress('https://partner.example/dsp')).toBe(true)
    expect(isValidCatenaXPartnerAddress('http://localhost:8185/dsp')).toBe(true)
    expect(isValidCatenaXPartnerAddress('/relative/dsp')).toBe(false)
  })
})
