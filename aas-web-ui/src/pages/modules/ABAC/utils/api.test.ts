import type { BaSyxComponentKey } from '@/types/BaSyx'
import { describe, expect, it } from 'vitest'
import { backendErrorMessage, buildAbacUrl, buildRuleActionPath, buildVersionPath } from './api'

describe('buildAbacUrl', () => {
  it.each<[BaSyxComponentKey, string]>([
    ['AASDiscovery', '/lookup/shells'],
    ['AASRegistry', '/shell-descriptors'],
    ['SubmodelRegistry', '/submodel-descriptors'],
    ['AASRepo', '/shells'],
    ['SubmodelRepo', '/submodels'],
    ['ConceptDescriptionRepo', '/concept-descriptions'],
  ])('derives the service URL for %s while preserving its context path', (component, suffix) => {
    for (const context of ['', '/services/repository']) {
      for (const trailingSlash of ['', '/']) {
        expect(buildAbacUrl(`https://example.com${context}${suffix}${trailingSlash}`, component))
          .toBe(`https://example.com${context}/security/abac`)
      }
    }
  })

  it('preserves a base URL when its component suffix is absent', () => {
    expect(buildAbacUrl('https://example.com/services/repository/', 'AASRepo'))
      .toBe('https://example.com/services/repository/security/abac')
  })

  it('only removes the component suffix at the end of the path', () => {
    expect(buildAbacUrl('https://example.com/shells/proxy/shells', 'AASRepo'))
      .toBe('https://example.com/shells/proxy/security/abac')
  })

  it('uses the base URL for a component without a known suffix', () => {
    expect(buildAbacUrl('https://example.com/company/', 'CompanyLookup'))
      .toBe('https://example.com/company/security/abac')
  })

  it('does not append the ABAC endpoint twice', () => {
    expect(buildAbacUrl('https://example.com/context/security/abac/', 'AASRepo'))
      .toBe('https://example.com/context/security/abac')
  })

  it.each(['', ' '.repeat(3)])('returns no candidate for an empty URL %j', url => {
    expect(buildAbacUrl(url, 'AASRepo')).toBeUndefined()
  })
})

describe('buildVersionPath', () => {
  it('builds the version root under the service context', () => {
    expect(buildVersionPath('https://example.com/context/security/abac', '12'))
      .toBe('https://example.com/context/security/abac/policy-versions/12')
  })

  it('appends multiple resource segments in order', () => {
    expect(buildVersionPath('https://example.com/security/abac', '12', 'definitions', 'formulas', 'Example'))
      .toBe('https://example.com/security/abac/policy-versions/12/definitions/formulas/Example')
  })
})

describe('buildRuleActionPath', () => {
  it.each(['duplicate', 'move', 'enabled'])('builds the %s action for the specified rule', action => {
    expect(buildRuleActionPath('https://example.com/context/security/abac', '12', '3', action))
      .toBe(`https://example.com/context/security/abac/policy-versions/12/rules/3/${action}`)
  })
})

describe('backendErrorMessage', () => {
  it.each([undefined, null, {}, 42, [{ code: 'unknown' }], { text: '' }])('leaves the status fallback available for %j', payload => {
    expect(backendErrorMessage(payload)).toBeUndefined()
  })

  it('ignores entries without text and combines meaningful messages', () => {
    expect(backendErrorMessage([
      { code: 'unknown' }, { text: ' first ' }, null, { message: 'second' }, '',
    ])).toBe('first\nsecond')
    expect(backendErrorMessage({ error: ' rejected ' })).toBe('rejected')
  })
})
