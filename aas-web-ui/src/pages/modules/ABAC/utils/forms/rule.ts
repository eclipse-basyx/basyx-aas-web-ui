import type { Representation, RuleFilterState, RuleState } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import type { AccessPermissionRule } from '@/schemas/access-rules/types/accessRules.generated'
import { equals, isObject } from '../object'
import { decodeAcl, decodeObjectItems, encodeAcl, encodeObjectItem } from './definitions'
import { decodeExpression, encodeExpression } from './expression'

/**
 * Codec between a configured access permission rule and the guided form state.
 * A rule is representable when its ACL/formula alternatives and object lists
 * match a supported shape; any unsupported content keeps the dialog in JSON mode with the rule
 * unchanged. Applying a state preserves outer extra properties; unsupported
 * nested extras require JSON mode. Cleared coexisting lists keep an empty
 * array, cleared optional references are omitted from the complete document, and rules
 * without an alternative open as a pending inline state instead of staying
 * unrecoverable.
 */

const RULE_KEYS = ['ACL', 'USEACL', 'OBJECTS', 'USEOBJECTS', 'FORMULA', 'USEFORMULA', 'FILTER', 'FILTERLIST'] as const satisfies readonly (keyof AccessPermissionRule)[]

function ruleExtras (ruleDocument: JsonObject): JsonObject {
  const extras: JsonObject = {}
  for (const [key, value] of Object.entries(ruleDocument)) {
    if ((RULE_KEYS as readonly string[]).includes(key)) {
      continue
    }
    extras[key] = value
  }
  return extras
}

function isStringArray (inputValue: unknown): inputValue is string[] {
  return Array.isArray(inputValue) && inputValue.every(value => typeof value === 'string')
}

function decodeFilter (inputValue: unknown): RuleFilterState | undefined {
  if (!isObject(inputValue)) {
    return undefined
  }
  const keys = Object.keys(inputValue)
  // FILTER carries FRAGMENT plus at most one of CONDITION/USEFORMULA; a
  // condition-less filter is a pending edit and stays representable.
  if (!keys.every(key => ['FRAGMENT', 'CONDITION', 'USEFORMULA'].includes(key))) {
    return undefined
  }
  const fragment = inputValue.FRAGMENT
  if (typeof fragment !== 'string') {
    return undefined
  }
  const hasCondition = keys.includes('CONDITION')
  const hasUseFormula = keys.includes('USEFORMULA')
  if (hasCondition && hasUseFormula) {
    return undefined
  }
  if (hasCondition) {
    const condition = decodeExpression(inputValue.CONDITION)
    if (condition === undefined) {
      return undefined
    }
    return { fragment, condition: { mode: 'inline', condition } }
  }
  if (hasUseFormula) {
    const name = inputValue.USEFORMULA
    if (name !== null && typeof name !== 'string') {
      return undefined
    }
    return { fragment, condition: { mode: 'reference', name: name ?? undefined } }
  }
  return { fragment, condition: undefined }
}

/**
 * Matches backend order: FILTERLIST entries first, followed by the legacy FILTER.
 */
function decodeRuleFilters (rule: JsonObject): RuleFilterState[] | undefined {
  const values: unknown[] = []
  if (Object.hasOwn(rule, 'FILTERLIST')) {
    if (!Array.isArray(rule.FILTERLIST)) {
      return undefined
    }
    values.push(...rule.FILTERLIST)
  }
  if (Object.hasOwn(rule, 'FILTER')) {
    values.push(rule.FILTER)
  }
  const filters = values.map(value => decodeFilter(value))
  return filters.every(filter => filter !== undefined) ? filters : undefined
}

/**
 * Builds one filter document; incomplete conditions remain editable pending input.
 */
function encodeFilter (filter: RuleFilterState): JsonObject {
  const document: JsonObject = {}
  if (filter.fragment !== undefined) {
    document.FRAGMENT = filter.fragment
  }
  const condition = filter.condition
  if (condition?.mode === 'inline' && condition.condition !== null) {
    document.CONDITION = encodeExpression(condition.condition)
  } else if (condition?.mode === 'reference' && condition.name !== undefined) {
    document.USEFORMULA = condition.name
  }
  return document
}

/**
 * Resolves one alternative reference value: a string name, a null
 * deletion marker, or absent content.
 */
function decodeReference (
  inputValue: unknown,
  hasKey: boolean,
): { mode: 'present', name: string } | { mode: 'cleared' } | { mode: 'absent' } | { mode: 'invalid' } {
  if (!hasKey) {
    return { mode: 'absent' }
  }
  if (inputValue === null) {
    return { mode: 'cleared' }
  }
  return typeof inputValue === 'string' ? { mode: 'present', name: inputValue } : { mode: 'invalid' }
}

export function representRule (inputValue: unknown): Representation & { rule: RuleState | undefined } {
  if (!isObject(inputValue)) {
    return { ok: false, limitation: 'structure', rule: undefined }
  }

  // Backend rule grammar enforces exactly one ACL alternative.
  if (Object.hasOwn(inputValue, 'ACL') && Object.hasOwn(inputValue, 'USEACL')) {
    return { ok: false, limitation: 'structure', rule: undefined }
  }
  // Backend rule grammar enforces exactly one formula alternative.
  if (Object.hasOwn(inputValue, 'FORMULA') && Object.hasOwn(inputValue, 'USEFORMULA')) {
    return { ok: false, limitation: 'structure', rule: undefined }
  }

  const useAcl = decodeReference(inputValue.USEACL, Object.hasOwn(inputValue, 'USEACL'))
  if (useAcl.mode === 'invalid') {
    return { ok: false, limitation: 'structure', rule: undefined }
  }
  const useFormula = decodeReference(inputValue.USEFORMULA, Object.hasOwn(inputValue, 'USEFORMULA'))
  if (useFormula.mode === 'invalid') {
    return { ok: false, limitation: 'structure', rule: undefined }
  }

  const objectsPresent = Object.hasOwn(inputValue, 'OBJECTS')
  const useObjectsPresent = Object.hasOwn(inputValue, 'USEOBJECTS')
  const entries = objectsPresent ? decodeObjectItems(inputValue.OBJECTS) : []
  const references = useObjectsPresent
    ? (isStringArray(inputValue.USEOBJECTS) ? inputValue.USEOBJECTS : undefined)
    : []
  if (entries === undefined || references === undefined) {
    return { ok: false, limitation: 'attributeItem', rule: undefined }
  }

  let acl: RuleState['acl']
  if (Object.hasOwn(inputValue, 'ACL')) {
    const aclResult = decodeAcl(inputValue.ACL)
    if (!aclResult.ok) {
      return { ok: false, limitation: aclResult.limitation, rule: undefined }
    }
    acl = { mode: 'inline', acl: aclResult.acl! }
  } else if (useAcl.mode === 'present') {
    acl = { mode: 'reference', name: useAcl.name }
  } else if (useAcl.mode === 'cleared') {
    acl = { mode: 'reference', name: undefined }
  } else {
    // A no-alternative rule opens as a pending inline ACL; the round-trip
    // check below verifies nothing is invented for it.
    acl = { mode: 'inline', acl: {} }
  }

  let formula: RuleState['formula']
  if (Object.hasOwn(inputValue, 'FORMULA')) {
    if (inputValue.FORMULA === null) {
      formula = { mode: 'inline', formula: null }
    } else {
      const expression = decodeExpression(inputValue.FORMULA)
      if (expression === undefined) {
        return { ok: false, limitation: 'expression', rule: undefined }
      }
      formula = { mode: 'inline', formula: expression }
    }
  } else if (useFormula.mode === 'present') {
    formula = { mode: 'reference', name: useFormula.name }
  } else if (useFormula.mode === 'cleared') {
    formula = { mode: 'reference', name: undefined }
  } else {
    // A rule without a formula alternative opens as a pending inline formula.
    formula = { mode: 'inline', formula: null }
  }

  const filters = decodeRuleFilters(inputValue)
  if (!filters) {
    return { ok: false, limitation: 'expression', rule: undefined }
  }

  const formState: RuleState = { acl, objects: { entries, references }, formula, filters }
  // Opening the form must not change anything: only documents that the state
  // rebuilds identically are representable.
  if (!equals(inputValue, applyRuleState(inputValue, formState))) {
    return { ok: false, limitation: 'structure', rule: undefined }
  }
  return { ok: true, rule: formState }
}

export function ruleFormState (inputValue: unknown): RuleState | undefined {
  return representRule(inputValue).rule
}

/**
 * Builds the effective rule document. The exact alternative set the backend
 * enforces (ACL/USEACL, FORMULA/USEFORMULA) lands with one selected key;
 * switching alternatives relies on the shared update detector for the
 * deletion markers at the request boundary. Inline object lists retain their
 * explicit empty selection; cleared optional references and removed filters are
 * omitted. Untouched empty JSON reference arrays retain their original shape.
 */
export function applyRuleState (sourceRule: JsonObject | undefined, formState: RuleState): JsonObject {
  const updatedRule: JsonObject = { ...ruleExtras(sourceRule ?? {}) }

  function emitList (key: 'OBJECTS' | 'USEOBJECTS', entries: unknown[] | string[]): void {
    if (entries.length > 0) {
      updatedRule[key] = entries
      return
    }
    const previousEntries = sourceRule?.[key]
    if (Array.isArray(previousEntries) && (key === 'OBJECTS' || previousEntries.length === 0)) {
      updatedRule[key] = []
    }
  }

  function emitReference (key: 'USEACL' | 'USEFORMULA', name: string | undefined): void {
    if (name !== undefined) {
      updatedRule[key] = name
      return
    }
  }

  if (formState.acl.mode === 'inline') {
    const aclDocument = encodeAcl(formState.acl.acl)
    // Preserve an absent ACL while the inline controls are still empty.
    if (Object.keys(aclDocument).length > 0 || (sourceRule !== undefined && Object.hasOwn(sourceRule, 'ACL'))) {
      updatedRule.ACL = aclDocument
    }
  } else {
    emitReference('USEACL', formState.acl.name)
  }
  emitList('OBJECTS', formState.objects.entries.map(entry => encodeObjectItem(entry)))
  emitList('USEOBJECTS', formState.objects.references)

  if (formState.formula.mode === 'inline') {
    if (formState.formula.formula !== null) {
      updatedRule.FORMULA = encodeExpression(formState.formula.formula)
    }
  } else {
    emitReference('USEFORMULA', formState.formula.name)
  }

  const filters = formState.filters.map(filter => encodeFilter(filter))
  const originalFilters = [
    ...(Array.isArray(sourceRule?.FILTERLIST) ? sourceRule.FILTERLIST : []),
    ...(sourceRule && Object.hasOwn(sourceRule, 'FILTER') ? [sourceRule.FILTER] : []),
  ]
  if (equals(filters, originalFilters)) {
    // Viewing, switching modes, and edits elsewhere must retain both source fields exactly.
    for (const key of ['FILTER', 'FILTERLIST'] as const) {
      if (sourceRule && Object.hasOwn(sourceRule, key)) {
        updatedRule[key] = sourceRule[key]
      }
    }
  } else if (filters.length > 0) {
    // The first actual filter change normalizes to FILTERLIST. Omitted FILTER and
    // removed lists become deletion markers during complete-document update preparation.
    updatedRule.FILTERLIST = filters
  }
  return updatedRule
}
