import type { ObjectItemKind } from '../../types/forms'

export const OBJECT_TARGETS: Partial<Record<ObjectItemKind, readonly string[]>> = {
  IDENTIFIABLE: ['aas', 'sm', 'cd'],
  REFERABLE: ['sme'],
  DESCRIPTOR: ['aasdesc', 'smdesc'],
}

/**
 * Recognizes editable compact identifier structure without claiming schema validity.
 * Unrecognized values remain available through Custom; the schema checks constraints.
 */
export function readObjectIdentifier (kind: ObjectItemKind, value: string) {
  const match = /^\$(aas|sm|cd|sme|aasdesc|smdesc)\("([^"\n]*)"\)(.*)$/.exec(value)
  if (!match || !OBJECT_TARGETS[kind]?.includes(match[1]!)) {
    return undefined
  }
  const suffix = match[3]!
  if (kind === 'REFERABLE' ? !suffix.startsWith('.') : suffix !== '') {
    return undefined
  }
  return { target: match[1]!, identifier: match[2]!, path: suffix.slice(1) }
}

/**
 * Builds compact identifier syntax; unfinished input remains editable and advisory-only.
 */
export function writeObjectIdentifier (target: string, identifier: string, path = ''): string {
  return `$${target}("${identifier}")${target === 'sme' ? `.${path}` : ''}`
}
