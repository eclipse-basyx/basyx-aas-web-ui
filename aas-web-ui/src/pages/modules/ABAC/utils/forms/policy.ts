import type { DefinitionKind, DefinitionsMap } from '../../types/definitions'
import type { FormLimitation, Representation } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import type { PolicyDraft, PolicyDraftDefinition } from '../../types/policy'
import type { Rule } from '../../types/rules'
import { DEFINITION_LIST_KEYS } from '../../constants/forms'
import { findDefinitionReferences } from '../definitionUsage'
import { equals, isObject } from '../object'
import { representDefinition } from './definitions'
import { representRule } from './rule'

/**
 * Codec between a policy import document and the policy form state.
 * AllAccessPermissionRules holds the definition collections and rules.
 * The whole document and every entry must round-trip unchanged; extra
 * properties on the outer document and its permission-rules object are retained.
 */

const LIST_KEYS = Object.values(DEFINITION_LIST_KEYS)
const ALL_KEYS = [...LIST_KEYS, 'rules'] as const

/**
 * Resolve draft references without consulting a saved policy or changing the document.
 */
export function policyDraftDefinitionUsage (policyDraft: PolicyDraft, kind: DefinitionKind, name: string) {
  const definitions = Object.fromEntries(Object.keys(DEFINITION_LIST_KEYS).map(kind => [
    kind, policyDraft.definitions.filter(item => item.kind === kind).map(item => item.doc),
  ])) as DefinitionsMap
  const rules = policyDraft.rules.map((configured_rule_json, i) => ({ rule_index: i + 1, configured_rule_json })) as Rule[]
  return findDefinitionReferences(kind, name, definitions, rules)
}

export function representPolicyDraft (inputValue: unknown): Representation {
  const policyDocument = isObject(inputValue) ? inputValue : undefined
  if (!policyDocument || !Object.hasOwn(policyDocument, 'AllAccessPermissionRules')) {
    return { ok: false, limitation: 'structure' }
  }
  const permissionRules = isObject(policyDocument.AllAccessPermissionRules) ? policyDocument.AllAccessPermissionRules : undefined
  if (!permissionRules) {
    return { ok: false, limitation: 'structure' }
  }

  // Every entry must round-trip faithfully. This also runs after form commits,
  // so unsupported edits can fall back to JSON without losing the document.
  const limitation = policyDraftLimitation(inputValue)
  if (limitation !== undefined) {
    return { ok: false, limitation }
  }

  const policyDraft = policyDraftState(inputValue)
  // Opening the policy form must not change anything.
  if (!policyDraft || !equals(policyDocument, applyPolicyDraft(policyDocument, policyDraft))) {
    return { ok: false, limitation: 'structure' }
  }
  return { ok: true }
}

/**
 * Undefined when every definition and rule of the policy is representable;
 * otherwise the limitation token to explain to the user.
 */
function policyDraftLimitation (inputValue: unknown): FormLimitation | undefined {
  const policyDocument = isObject(inputValue) ? inputValue : undefined
  const permissionRules = policyDocument && isObject(policyDocument.AllAccessPermissionRules) ? policyDocument.AllAccessPermissionRules : undefined
  if (!permissionRules) {
    return 'structure'
  }
  for (const kind of Object.keys(DEFINITION_LIST_KEYS) as DefinitionKind[]) {
    const definitionDocuments = permissionRules[DEFINITION_LIST_KEYS[kind]]
    if (definitionDocuments === undefined) {
      continue
    }
    if (!Array.isArray(definitionDocuments)) {
      return 'structure'
    }
    for (const entry of definitionDocuments) {
      const representation = representDefinition(kind, entry)
      if (!representation.ok) {
        return representation.limitation
      }
    }
  }
  const rules = permissionRules.rules
  if (rules !== undefined) {
    if (!Array.isArray(rules)) {
      return 'structure'
    }
    for (const rule of rules) {
      const representation = representRule(rule)
      if (!representation.ok) {
        return representation.limitation
      }
    }
  }
  return undefined
}

/**
 * Flattens definition collections into form entries without validating each document.
 * Definition/rule objects retain their source references; callers must replace, not mutate them.
 * representPolicyDraft separately checks editable shapes and round-trip preservation.
 */
export function policyDraftState (inputValue: unknown): PolicyDraft | undefined {
  const policyDocument = isObject(inputValue) ? inputValue : undefined
  if (!policyDocument || !isObject(policyDocument.AllAccessPermissionRules)) {
    return undefined
  }
  const permissionRules = policyDocument.AllAccessPermissionRules
  const definitions: PolicyDraftDefinition[] = []
  for (const kind of Object.keys(DEFINITION_LIST_KEYS) as DefinitionKind[]) {
    const definitionDocuments = permissionRules[DEFINITION_LIST_KEYS[kind]]
    if (definitionDocuments === undefined || !Array.isArray(definitionDocuments)) {
      continue
    }
    for (const entry of definitionDocuments) {
      if (!isObject(entry)) {
        return undefined
      }
    }
    for (const entry of definitionDocuments as JsonObject[]) {
      definitions.push({ kind, doc: entry })
    }
  }
  const rules = permissionRules.rules
  if (rules !== undefined && !Array.isArray(rules)) {
    return undefined
  }
  for (const rule of (rules ?? []) as JsonObject[]) {
    if (!isObject(rule)) {
      return undefined
    }
  }
  return { definitions, rules: (rules ?? []) as JsonObject[] }
}

/**
 * Rebuilds the policy document from the policy form state. Extra properties on the
 * source document and its AllAccessPermissionRules object survive verbatim.
 * Definition and rule arrays follow form order. Missing rules stay absent until
 * a rule is added; existing arrays remain present when cleared.
 */
export function applyPolicyDraft (sourcePolicy: JsonObject | undefined, policyDraft: PolicyDraft): JsonObject {
  const updatedPolicy: JsonObject = {}
  const sourcePolicyDocument = isObject(sourcePolicy) ? sourcePolicy : undefined
  if (sourcePolicyDocument) {
    for (const [key, value] of Object.entries(sourcePolicyDocument)) {
      if (key !== 'AllAccessPermissionRules') {
        updatedPolicy[key] = value
      }
    }
  }
  const sourcePermissionRules = sourcePolicyDocument && isObject(sourcePolicyDocument.AllAccessPermissionRules) ? sourcePolicyDocument.AllAccessPermissionRules : undefined
  const permissionRules: JsonObject = {}
  if (sourcePermissionRules) {
    for (const [key, value] of Object.entries(sourcePermissionRules)) {
      if (!(ALL_KEYS as readonly string[]).includes(key)) {
        permissionRules[key] = value
      }
    }
  }

  for (const kind of Object.keys(DEFINITION_LIST_KEYS) as DefinitionKind[]) {
    const definitionDocuments = policyDraft.definitions.filter(entry => entry.kind === kind).map(entry => entry.doc)
    if (definitionDocuments.length > 0) {
      permissionRules[DEFINITION_LIST_KEYS[kind]] = definitionDocuments
    } else if (sourcePermissionRules && Array.isArray(sourcePermissionRules[DEFINITION_LIST_KEYS[kind]])) {
      permissionRules[DEFINITION_LIST_KEYS[kind]] = []
    }
  }
  if (policyDraft.rules.length > 0 || !sourcePolicy || (sourcePermissionRules && Object.hasOwn(sourcePermissionRules, 'rules'))) {
    permissionRules.rules = policyDraft.rules
  }

  updatedPolicy.AllAccessPermissionRules = permissionRules
  return updatedPolicy
}
