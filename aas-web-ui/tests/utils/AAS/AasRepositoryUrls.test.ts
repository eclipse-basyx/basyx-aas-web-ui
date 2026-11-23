import { describe, expect, it } from 'vitest'
import { aasEndpointUrl, shellsUrl } from '@/utils/AAS/AasRepositoryUrls'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

describe('AasRepositoryUrls', () => {
  it.each([
    ['https://repo.test', 'https://repo.test/shells'],
    ['https://repo.test/', 'https://repo.test/shells'],
    ['https://repo.test/shells', 'https://repo.test/shells'],
    [' https://repo.test/shells/ ', 'https://repo.test/shells'],
    ['  ', ''],
  ])('returns the /shells endpoint of %j', (aasRepoUrl, expected) => {
    expect(shellsUrl(aasRepoUrl)).toBe(expected)
  })

  it('returns the endpoint of an AAS with its Base64 encoded ID', () => {
    expect(aasEndpointUrl('https://repo.test/', ' urn:aas:1 ')).toBe(`https://repo.test/shells/${base64Encode('urn:aas:1')}`)
  })

  it('returns no AAS endpoint without an ID or a repository URL', () => {
    expect(aasEndpointUrl('https://repo.test', ' ')).toBe('')
    expect(aasEndpointUrl('', 'urn:aas:1')).toBe('')
  })
})
