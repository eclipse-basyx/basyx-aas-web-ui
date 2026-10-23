import type { BaSyxComponentKey } from '@/types/BaSyx'
import { describe, expect, it } from 'vitest'
import { AbacApiError, backendErrorMessage, buildAbacUrl, buildRuleActionPath, buildVersionPath, createAbacApiError, toSaveError } from './api'

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

describe('ABAC API failures', () => {
  it('preserves status, metadata, and structured paths from BaSyx error arrays', () => {
    const error = createAbacApiError([{
      code: '400', correlationId: 'request-id', messageType: 'Error',
      text: 'Invalid reference', timestamp: '2026-10-21T12:00:00Z',
      paths: [['ACL', 'USEATTRIBUTES']],
    }], 400)
    expect(error).toBeInstanceOf(AbacApiError)
    expect(error.status).toBe(400)
    expect(error.messages[0]).toMatchObject({ code: '400', correlationId: 'request-id' })
    expect(toSaveError(error, 'Save failed')).toEqual({
      title: 'Save failed', messages: ['Invalid reference'], paths: [['ACL', 'USEATTRIBUTES']],
    })
  })

  it('maps the legacy duplicate-definition identifier centrally', () => {
    const error = createAbacApiError({ text: '409 Conflict: ABACPOLICY-DEFINITION-DUPLICATE definition already exists: test' }, 409)
    expect(error.paths).toEqual([['name']])
    expect(toSaveError(error, 'Create failed').paths).toEqual([['name']])
  })

  it('prefers explicit backend paths over the legacy fallback', () => {
    const error = createAbacApiError({
      text: 'ABACPOLICY-DEFINITION-DUPLICATE', paths: [['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'name']],
    })
    expect(error.paths).toEqual([['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'name']])
  })

  it('does not guess field locations from materialization error text', () => {
    const error = createAbacApiError({ text: '400 Bad Request: ABACPOLICY-DRAFT-MATERIALIZE parse access model: rule 1: USEATTRIBUTES "fwee" not found' }, 400)
    expect(error.paths).toBeUndefined()
    expect(error.message).toContain('"fwee" not found')
  })

  it('locates the missing reference in the submitted rule', () => {
    const data = { text: 'ABACPOLICY-DRAFT-MATERIALIZE parse access model: rule 1: USEATTRIBUTES "fwee" not found' }
    expect(createAbacApiError(data, 400, { ACL: { USEATTRIBUTES: 'fwee' } }).paths).toEqual([['ACL', 'USEATTRIBUTES']])
    expect(createAbacApiError(data, 400, { ACL: { USEATTRIBUTES: 'different' } }).paths).toBeUndefined()
  })

  it('uses the one-based rule location for a policy import', () => {
    const data = { text: 'rule 2: USEATTRIBUTES "fwee" not found' }
    const policy = { AllAccessPermissionRules: { rules: [
      { ACL: { USEATTRIBUTES: 'fwee' } }, { ACL: { USEATTRIBUTES: 'fwee' } },
    ] } }
    expect(createAbacApiError(data, 400, policy).paths).toEqual([['AllAccessPermissionRules', 'rules', '1', 'ACL', 'USEATTRIBUTES']])
  })

  it.each([1, 0, 3])('does not attribute rule %s failures to unrelated definitions', rule => {
    const body = { AllAccessPermissionRules: {
      rules: [{ USEACL: 'used' }],
      DEFACLS: [{ name: 'used', acl: { USEATTRIBUTES: 'missing' } }, { name: 'unused', acl: { USEATTRIBUTES: 'missing' } }],
    } }
    expect(createAbacApiError({ text: `rule ${rule}: USEATTRIBUTES "missing" not found` }, 400, body).paths).toBeUndefined()
  })

  it('locates missing formula references inside a filter list', () => {
    const body = { USEACL: 'acl', FILTERLIST: [{ FRAGMENT: '$sm#idShort', USEFORMULA: 'missing' }] }
    expect(createAbacApiError({ text: 'FILTERLIST[1]: USEFORMULA "missing" not found' }, 400, body).paths).toEqual([['FILTERLIST', '0', 'USEFORMULA']])
  })

  it('ignores malformed paths and keeps valid paths, including root diagnostics', () => {
    const error = createAbacApiError({ text: 'Invalid document', paths: [null, 'name', ['rules', 1], [], ['name']] })
    expect(error.paths).toEqual([[], ['name']])
  })

  it('keeps ordinary errors and empty responses usable without field locations', () => {
    expect(toSaveError(new Error('Network failed'), 'Save failed')).toEqual({
      title: 'Save failed', messages: ['Network failed'], paths: undefined,
    })
    expect(createAbacApiError(undefined, 503).message).toBe('ABAC request failed with status 503')
    expect(createAbacApiError('Plain failure').message).toBe('Plain failure')
  })
})
