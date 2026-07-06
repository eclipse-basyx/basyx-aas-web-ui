import { beforeEach, describe, expect, it } from 'vitest'
import {
  getRecentCatenaXPartners,
  rememberRecentCatenaXPartner,
} from '@/pages/modules/CatenaXplorer/catenaXplorerPartners'

describe('catenaXplorerPartners.ts', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores recent partners per EDC proxy and de-duplicates by counterparty/address', () => {
    rememberRecentCatenaXPartner('default', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })
    rememberRecentCatenaXPartner('default', {
      name: 'Partner A',
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })
    rememberRecentCatenaXPartner('other', {
      counterPartyId: 'TEST_PARTICIPANT_ID_2',
      counterPartyAddress: 'https://other.example/api/v1/dsp',
    })

    expect(getRecentCatenaXPartners('default')).toEqual([
      {
        id: 'test-participant-id-https-counterparty-dsp-test-api-v1-dsp',
        name: 'Partner A',
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      },
    ])
    expect(getRecentCatenaXPartners('other')).toHaveLength(1)
  })
})
