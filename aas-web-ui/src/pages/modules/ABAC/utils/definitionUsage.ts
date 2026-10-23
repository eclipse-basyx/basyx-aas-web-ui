import type { DefinitionKind, DefinitionsMap, DefinitionUsage } from '../types/definitions'
import type { JsonObject } from '../types/json'
import type { Rule } from '../types/rules'
import { isObject } from './object'

/**
 * Small reference check for the delete guard: finds where a definition is used
 * inside the selected policy version, matching the backend's own reference
 * resolution (trimmed names) as verified against basyx-go-components.
 *
 * Missing or incomplete data is never classified as usage; the backend rejection stays the final authority.
 */

function trimName (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function matchesReference (reference: unknown, target: string): boolean {
  return trimName(reference) !== undefined && trimName(reference) === target
}

function aclUsesAttributes (acl: unknown, target: string): boolean {
  return isObject(acl) && matchesReference(acl.USEATTRIBUTES, target)
}

function ruleReferencesDefinition (rule: unknown, target: string, kind: DefinitionKind): boolean {
  if (!isObject(rule)) {
    return false
  }
  switch (kind) {
    case 'acls': {
      return matchesReference(rule.USEACL, target)
    }
    case 'formulas': {
      return matchesReference(rule.USEFORMULA, target)
        || (isObject(rule.FILTER) && matchesReference(rule.FILTER.USEFORMULA, target))
        || (Array.isArray(rule.FILTERLIST) && rule.FILTERLIST.some(filter => isObject(filter) && matchesReference(filter.USEFORMULA, target)))
    }
    case 'objects': {
      return Array.isArray(rule.USEOBJECTS) && rule.USEOBJECTS.some(reference => matchesReference(reference, target))
    }
    case 'attributes': {
      return aclUsesAttributes(rule.ACL, target) || aclUsesAttributes(rule.USEACL, target)
    }
  }
}

function useReferenceList (raw: unknown, target: string): boolean {
  return Array.isArray(raw) && raw.some(reference => matchesReference(reference, target))
}

function definitionReferencesDefinition (definition: JsonObject, target: string, ownKind: DefinitionKind, targetKind: DefinitionKind): boolean {
  // Which fields may reference definitions of the target kind (mirroring the
  // backend materialization: only rules reference ACLs and formulas; only
  // object definitions reference object definitions).
  switch (targetKind) {
    case 'attributes': {
      if (ownKind === 'acls') {
        return aclUsesAttributes(definition.acl, target)
      }
      if (ownKind === 'attributes') {
        return useReferenceList(definition.USEATTRIBUTES, target)
      }
      return false
    }
    case 'objects': {
      return ownKind === 'objects' && useReferenceList(definition.USEOBJECTS, target)
    }
    case 'acls':
    case 'formulas': {
      return false
    }
  }
}

export function findDefinitionReferences (
  kind: DefinitionKind,
  name: string,
  definitions: DefinitionsMap | undefined,
  rules: Rule[] | undefined,
): DefinitionUsage[] {
  const target = trimName(name)
  if (target === undefined || definitions === undefined) {
    return []
  }

  const usages: DefinitionUsage[] = []

  for (const rule of rules ?? []) {
    if (ruleReferencesDefinition(rule?.configured_rule_json as unknown, target, kind)) {
      usages.push({ kind: 'rule', ruleIndex: rule.rule_index })
    }
  }

  for (const otherKind of Object.keys(definitions) as DefinitionKind[]) {
    for (const entry of definitions[otherKind] ?? []) {
      const name = trimName((entry as JsonObject).name)
      if (otherKind === kind && name === target) {
        continue
      }
      if (definitionReferencesDefinition(entry as JsonObject, target, otherKind, kind)) {
        usages.push({ kind: 'definition', definitionKind: otherKind, name: name ?? String((entry as JsonObject).name) })
      }
    }
  }

  return usages
}
