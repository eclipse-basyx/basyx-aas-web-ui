import { describe, expect, it } from 'vitest'
import { edcPolicyTypeLabel, edcPolicyTypes } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPolicyType'

function policyWithPermission (permission: unknown) {
  return { '@id': 'policy-1', 'policy': { '@type': 'odrl:Set', 'odrl:permission': permission } }
}

describe('EdcPolicyType', () => {
  it.each([
    ['a compact IRI', { '@id': 'odrl:use' }, ['Usage']],
    // eslint-disable-next-line unicorn/prefer-https -- The ODRL namespace is an exact identifier.
    ['a full IRI', { '@id': 'http://www.w3.org/ns/odrl/2/use' }, ['Usage']],
    ['a bare name', { '@id': 'access' }, ['Access']],
    ['a Catena-X compact IRI', { '@id': 'cx-policy:access' }, ['Access']],
    ['a Catena-X full IRI', { '@id': 'https://w3id.org/catenax/policy/access' }, ['Access']],
    ['a plain string', 'use', ['Usage']],
    ['an unknown namespace', { '@id': 'foo:use' }, []],
  ])('derives the type from an action given as %s', (_form, action, types) => {
    expect(edcPolicyTypes(policyWithPermission({ 'odrl:action': action }))).toEqual(types)
  })

  it('derives the type from all permissions of an array', () => {
    const policy = policyWithPermission([
      { 'odrl:action': { '@id': 'odrl:use' }, 'odrl:constraint': { 'odrl:leftOperand': 'cx-policy:FrameworkAgreement' } },
      { 'odrl:action': { '@id': 'odrl:use' }, 'odrl:constraint': { 'odrl:leftOperand': 'cx-policy:UsagePurpose' } },
    ])

    expect(edcPolicyTypes(policy)).toEqual(['Usage'])
  })

  it('gives a policy mixing access and usage permissions both types', () => {
    const policy = policyWithPermission([{ 'odrl:action': { '@id': 'odrl:use' } }, { 'odrl:action': { '@id': 'access' } }])

    expect(edcPolicyTypes(policy)).toEqual(['Access', 'Usage'])
    expect(edcPolicyTypeLabel(policy)).toBe('Access & Usage')
  })

  it('reads permissions and actions without prefix, as in the templates', () => {
    expect(edcPolicyTypes({ policy: { permission: [{ action: 'access' }] } })).toEqual(['Access'])
  })

  it('has no type without a permission with a known action', () => {
    expect(edcPolicyTypes({ policy: { 'odrl:permission': [] } })).toEqual([])
    expect(edcPolicyTypes({ policy: { 'odrl:permission': { 'odrl:action': {} } } })).toEqual([])
    expect(edcPolicyTypes(undefined)).toEqual([])
    expect(edcPolicyTypeLabel({})).toBe('')
  })
})
