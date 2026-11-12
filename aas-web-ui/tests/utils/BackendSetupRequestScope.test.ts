import type { SnackbarType } from '@/types/Application'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { describe, expect, it } from 'vitest'
import { isCoveredBackendRequest } from '@/utils/BackendSetupRequestScope'

const sources = [{ component: 'AASRepo' as const, url: 'https://example.com/api' }]

describe('Backend setup request scope', () => {
  it.each([
    ['AASRepo', 'https://example.com/api', 'https://example.com/api/shells?limit=100'],
    ['AASRepo', 'https://example.com/api/shells/', 'https://example.com/api/shells/'],
    ['AASRepo', 'https://example.com/', 'https://example.com/shells'],
    ['AASRegistry', 'https://example.com/api/shell-descriptors', 'https://example.com/api/shell-descriptors?limit=1'],
    ['SubmodelRepo', 'https://example.com/api', 'https://example.com/api/submodels?level=core'],
    ['SubmodelRepo', '/api/submodels', '/api/submodels?limit=1'],
  ] satisfies [BaSyxComponentKey, string, string][])('covers canonical %s collection reads from %s', (component, sourceUrl, requestUrl) => {
    expect(isCoveredBackendRequest({ operation: 'read', url: requestUrl }, [{ component, url: sourceUrl }])).toBe(true)
  })

  it.each([
    ['https://example.com/api', 'https://example.com/api/description'],
    ['https://example.com/api/shells/', 'https://example.com/api/description'],
    ['https://example.com/api/shells', 'https://example.com/api/shells?limit=1'],
  ])('covers explicit component checks from %s at %s', (sourceUrl, requestUrl) => {
    expect(isCoveredBackendRequest({ operation: 'connection-check', component: 'AASRepo', url: requestUrl }, [
      { component: 'AASRepo', url: sourceUrl },
    ])).toBe(true)
  })

  it.each([
    'https://example.com/api/shells/id',
    'https://example.com/api/shells/id/attachment',
    'https://example.com/api/companies',
    'https://example.com/api/description',
    'https://example.com/api/submodels',
    'https://example.com/other/shells',
    'https://other.example.com/api/shells',
    // eslint-disable-next-line unicorn/prefer-https -- An origin scheme mismatch must remain uncovered.
    'http://example.com/api/shells',
    'https://example.com:8443/api/shells',
    'https://user:password@example.com/api/shells',
  ])('retains an uncovered ordinary read at %s', url => {
    expect(isCoveredBackendRequest({ operation: 'read', url }, sources)).toBe(false)
  })

  it.each([
    { operation: 'connection-check', component: 'CompanyLookup', url: 'https://example.com/api/description' },
    { operation: 'connection-check', component: 'AASRegistry', url: 'https://example.com/api/shells' },
    { operation: 'connection-check', url: 'https://example.com/api/description' },
    { operation: 'connection-check', component: 'AASRepo', url: 'https://example.com/api/shells/id' },
  ] satisfies NonNullable<SnackbarType['networkRequest']>[])('requires a matching typed source check: %j', request => {
    expect(isCoveredBackendRequest(request, sources)).toBe(false)
  })

  it('retains requests without metadata or without a covered source', () => {
    expect(isCoveredBackendRequest(undefined, sources)).toBe(false)
    expect(isCoveredBackendRequest({ operation: 'read', url: 'https://example.com/api/shells' }, [])).toBe(false)
    expect(isCoveredBackendRequest({ operation: 'read', url: 'https://example.com/api/shells' }, [
      { component: 'CompanyLookup', url: 'https://example.com/api' },
    ])).toBe(false)
  })
})
