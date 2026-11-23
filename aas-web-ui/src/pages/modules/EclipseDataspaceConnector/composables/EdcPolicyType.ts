import type { CatenaXEdcPolicyDefinition } from '@/composables/Client/CatenaXEdcClient'

/**
 * Type of a policy by the actions of its permissions: an access policy controls who sees an asset in the catalog,
 * a usage policy how its data may be used.
 */
export type EdcPolicyType = 'Access' | 'Usage'

// eslint-disable-next-line unicorn/prefer-https -- The ODRL namespace is an exact identifier.
const ODRL_NAMESPACE = 'http://www.w3.org/ns/odrl/2/'
const CX_POLICY_NAMESPACE = 'https://w3id.org/catenax/policy/'

// An action is given as full IRI, compact IRI or bare name, depending on the JSON-LD context of the policy
const policyTypeOfAction = new Map<string, EdcPolicyType>([
  [`${ODRL_NAMESPACE}use`, 'Usage'],
  ['odrl:use', 'Usage'],
  ['use', 'Usage'],
  [`${ODRL_NAMESPACE}access`, 'Access'],
  ['odrl:access', 'Access'],
  [`${CX_POLICY_NAMESPACE}access`, 'Access'],
  ['cx-policy:access', 'Access'],
  ['access', 'Access'],
])

function asArray (value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

// An action is a node `{ "@id": "odrl:use" }` or, e.g. in the templates, a plain string
function actionId (action: unknown): string | undefined {
  if (typeof action === 'string') {
    return action
  }
  const id = (action as Record<string, unknown> | null)?.['@id']
  return typeof id === 'string' ? id : undefined
}

/**
 * Returns the types of a policy by the actions of all its permissions, in the order Access, Usage;
 * empty if no permission has a known action. A policy mixing both has both types.
 */
export function edcPolicyTypes (policyDefinition: CatenaXEdcPolicyDefinition | null | undefined): EdcPolicyType[] {
  const policy = policyDefinition?.policy
  const permissions = asArray(policy?.['odrl:permission'] ?? policy?.permission)
  const actions = permissions.flatMap(permission => {
    const permissionRecord = permission as Record<string, unknown> | null
    return asArray(permissionRecord?.['odrl:action'] ?? permissionRecord?.action)
  })
  const types = new Set(actions.map(action => policyTypeOfAction.get(actionId(action) ?? '')))
  return (['Access', 'Usage'] as const).filter(type => types.has(type))
}

/**
 * Returns the types of a policy for display, e.g. `Usage` or `Access & Usage`; '' if it has none.
 */
export function edcPolicyTypeLabel (policyDefinition: CatenaXEdcPolicyDefinition | null | undefined): string {
  return edcPolicyTypes(policyDefinition).join(' & ')
}
