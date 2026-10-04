import type { EventKind } from './types'

export interface VariableInfo {
  label: string
  description: string
  kind: EventKind
}

/** The variables the IDTA 02067 template defines (section 1.5.2.1). */
export const KNOWN_VARIABLES: Record<string, VariableInfo> = {
  'X-PRODUCTION-DAY': {
    label: 'Production day',
    description: 'Production day a shift belongs to: previous (-1), same (0) or next (1) day',
    kind: 'production',
  },
  'X-BREAK': {
    label: 'Breaks',
    description: 'Break periods inside a shift',
    kind: 'break',
  },
  'X-MAINTENANCE': {
    label: 'Maintenance',
    description: 'Maintenance periods inside a shift',
    kind: 'maintenance',
  },
}

/** The template spells the names with hyphens in the text and with underscores in its tables, accept both. */
export function normalizeVariableName (name: string): string {
  return name.trim().toUpperCase().replaceAll('_', '-')
}

export function getVariableInfo (name: string): VariableInfo | undefined {
  return KNOWN_VARIABLES[normalizeVariableName(name)]
}
