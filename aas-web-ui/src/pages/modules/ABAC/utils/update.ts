/**
 * Detects an update by resolving recognized alternative switches, merging the
 * submitted fields into the current document, and comparing the effective result.
 * Omission preserves fields, null deletes them, and arrays replace in full.
 * An identical result skips the request. Alternative switches or complete submitted
 * documents use PUT with the merged result; other changes use PATCH with a minimal
 * payload that retains deletion markers. These helpers select payloads; validation
 * and HTTP requests are handled by their callers.
 */

import type { DefinitionKind } from '../types/definitions'
import type { JsonObject } from '../types/json'
import { FORMULA_OPERATORS } from '../constants/formula'
import { equals, isObject, mergeObjects } from './object'

type UpdateContext = 'rule' | DefinitionKind | 'expression' | 'attribute' | 'acl' | 'filter'

// Logical operators come from logicalExpression.properties via FORMULA_OPERATORS.
// The remaining keys mirror Value.properties in the pinned schema. Review this
// list when updating the schema so nested operand switches remain recognized.
const EXPRESSION_KEYS = [
  ...FORMULA_OPERATORS, '$field', '$attribute', '$strVal', '$numVal', '$hexVal',
  '$dateTimeVal', '$timeVal', '$strCast', '$numCast', '$hexCast', '$dateTimeCast', '$timeCast',
  '$dayOfWeek', '$dayOfMonth', '$month', '$year',
]

// Selected oneOf alternatives from the pinned schema guide update behavior.
// This is not a complete exclusivity map: definition attributes/USEATTRIBUTES
// intentionally coexist during merging, despite their upstream oneOf constraint.
// Rule OBJECTS/USEOBJECTS and ACL ATTRIBUTES/USEATTRIBUTES also preserve omitted
// siblings. Review these choices alongside backend behavior when the schema changes.
const EXCLUSIVE_FIELDS: Partial<Record<UpdateContext, readonly (readonly string[])[]>> = {
  rule: [['ACL', 'USEACL'], ['FORMULA', 'USEFORMULA']],
  objects: [['objects', 'USEOBJECTS']],
  filter: [['CONDITION', 'USEFORMULA']],
  expression: [EXPRESSION_KEYS],
  attribute: [['CLAIM', 'GLOBAL', 'REFERENCE']],
}

/**
 * Computes changes between the current document and the effective merged result.
 * Missing result fields become null deletion markers; changed objects recurse,
 * while arrays and other values are included as complete replacements.
 *
 * @param original Current document before merging.
 * @param submitted Effective document after applying the submitted merge instructions.
 * @returns Minimal patch containing changed fields and deletion markers.
 */
function createPatch (original: JsonObject, submitted: JsonObject): JsonObject {
  const entries: [string, unknown][] = []
  for (const key of new Set([...Object.keys(original), ...Object.keys(submitted)])) {
    if (!Object.hasOwn(submitted, key)) {
      entries.push([key, null])
    } else if (!Object.hasOwn(original, key) || !equals(original[key], submitted[key])) {
      const before = original[key]
      const after = submitted[key]
      entries.push([key, isObject(before) && isObject(after) ? createPatch(before, after) : after])
    }
  }
  return Object.fromEntries(entries)
}

/**
 * Identifies nested object fields whose alternatives need update resolution.
 *
 * @param context Context of the parent object.
 * @param key Submitted property name within that object.
 * @returns Recognized child context, or undefined when no traversal is needed.
 */
function nestedContext (context: UpdateContext, key: string): UpdateContext | undefined {
  if (context === 'expression') {
    if (key === '$attribute') {
      return 'attribute'
    }
    if (EXPRESSION_KEYS.includes(key)) {
      return 'expression'
    }
  }
  if (context === 'rule') {
    if (key === 'ACL') {
      return 'acl'
    }
    if (key === 'FORMULA') {
      return 'expression'
    }
    if (key === 'FILTER') {
      return 'filter'
    }
  }
  if (context === 'filter' && key === 'CONDITION') {
    return 'expression'
  }
  if (context === 'formulas' && key === 'formula') {
    return 'expression'
  }
  if (context === 'acls' && key === 'acl') {
    return 'acl'
  }
  return undefined
}

/**
 * Adds deletion markers for omitted old alternatives when one new alternative is
 * explicitly selected. Preserves explicit siblings and traverses only recognized
 * nested object contexts, leaving array items and unrelated properties unchanged.
 *
 * @param original Current document at this nesting level.
 * @param submitted Submitted fields at this nesting level.
 * @param context Schema context identifying the applicable alternative groups.
 * @returns A new object containing submitted fields and inferred deletion markers.
 */
function resolveAlternatives (original: JsonObject, submitted: JsonObject, context: UpdateContext): JsonObject {
  // A single explicit non-null alternative removes only omitted old siblings.
  // Explicitly supplied siblings remain intact for validation/backend feedback.
  const resolved = { ...submitted }
  for (const group of EXCLUSIVE_FIELDS[context] ?? []) {
    const selected = group.filter(key => Object.hasOwn(submitted, key) && submitted[key] != null)
    // Multiple explicit alternatives are ambiguous: let validation report them.
    if (selected.length !== 1) {
      continue
    }
    for (const key of group) {
      if (key !== selected[0] && Object.hasOwn(original, key) && !Object.hasOwn(submitted, key)) {
        resolved[key] = null
      }
    }
  }
  for (const [key, value] of Object.entries(submitted)) {
    // Recurse only into recognized object contexts. Arrays replace in full, so
    // their items keep the submitted content without inferred deletions.
    const childContext = nestedContext(context, key)
    const previous = Object.hasOwn(original, key) ? original[key] : undefined
    if (childContext && isObject(previous) && isObject(value)) {
      Object.defineProperty(resolved, key, {
        value: resolveAlternatives(previous, value, childContext),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
  }
  return resolved
}

/**
 * Applies the shared merge and comparison steps for rule and definition updates.
 *
 * @param original Current document.
 * @param submitted Editor input containing merge instructions or a complete document.
 * @param context Rule or definition category used to resolve recognized alternatives.
 * @returns No-request mode, complete replacement, or minimal patch with deletion markers.
 */
function detectUpdate (original: JsonObject, submitted: JsonObject, context: 'rule' | DefinitionKind) {
  const resolved = resolveAlternatives(original, submitted, context)
  const merged = mergeObjects(original, resolved)
  const patch = createPatch(original, merged)
  if (Object.keys(patch).length === 0) {
    return { mode: 'unchanged' as const, payload: patch }
  }
  // A detected alternative switch replaces the complete merged document. Only
  // the mutually exclusive sibling is removed; other omitted fields survive.
  // Otherwise PUT is used only when the submitted document already is complete.
  return !equals(resolved, submitted) || equals(merged, submitted)
    ? { mode: 'replace' as const, payload: merged }
    : { mode: 'patch' as const, payload: patch }
}

/**
 * Selects PUT, PATCH, or no request for a rule using its effective merged document.
 * Omitted fields survive, null deletes fields, arrays replace in full, and recognized
 * exclusive alternatives can replace an omitted sibling without dropping other fields.
 *
 * @param original Current rule document.
 * @param submitted Editor input containing changes or a complete rule.
 * @returns Update mode and its replacement or patch payload; unchanged has an empty payload.
 */
export function detectRuleUpdate (original: JsonObject, submitted: JsonObject) {
  return detectUpdate(original, submitted, 'rule')
}

/**
 * Selects PUT, PATCH, or no request within the existing definition category.
 * Uses the same merge semantics as rule updates and resolves category-specific alternatives.
 *
 * @param original Current definition document, including its immutable name.
 * @param submitted Editor input with the immutable name reattached by the caller.
 * @param kind Existing definition category; pasted fields do not change it.
 * @returns Update mode and its replacement or patch payload; unchanged has an empty payload.
 */
export function detectDefinitionUpdate (original: JsonObject, submitted: JsonObject, kind: DefinitionKind) {
  return detectUpdate(original, submitted, kind)
}
