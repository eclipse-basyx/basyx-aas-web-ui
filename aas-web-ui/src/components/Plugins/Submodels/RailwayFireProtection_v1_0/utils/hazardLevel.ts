import type { HazardLevel, HazardLevelCode } from '../types'
import { stripQuotes } from './text'

export type HazardLevelMeta = {
  code: HazardLevelCode
  /** Value as defined in IDTA 02102 Table 6 */
  label: string
  /** Short text for badges and filter chips */
  short: string
  /** Compliance statement shown below the badge */
  status: string
  color: string
  icon: string
  /** Hazard level 1–3 for compliant values, otherwise 0 */
  level: number
  /** Order for "problems first" sorting: lower values come first */
  severity: number
}

const META: Record<HazardLevelCode, HazardLevelMeta> = {
  NC: {
    code: 'NC',
    label: 'Not Compliant',
    short: 'NC',
    status: 'Not compliant',
    color: 'error',
    icon: 'mdi-shield-off-outline',
    level: 0,
    severity: 0,
  },
  MTR: {
    code: 'MTR',
    label: 'Missing Test Results',
    short: 'MTR',
    status: 'Missing test results',
    color: 'warning',
    icon: 'mdi-progress-alert',
    level: 0,
    severity: 1,
  },
  unknown: {
    code: 'unknown',
    label: 'Unknown hazard level',
    short: '?',
    status: 'Unknown',
    color: 'grey',
    icon: 'mdi-help-circle-outline',
    level: 0,
    severity: 2,
  },
  AFNR: {
    code: 'AFNR',
    label: 'Approved Functional Necessity Report',
    short: 'AFNR',
    status: 'Approved functional necessity',
    color: 'info',
    icon: 'mdi-file-certificate-outline',
    level: 0,
    severity: 3,
  },
  HL1: {
    code: 'HL1',
    label: 'Compliant: Hazard Level 1',
    short: 'HL1',
    status: 'Compliant',
    color: 'success',
    icon: 'mdi-shield-check-outline',
    level: 1,
    severity: 4,
  },
  HL2: {
    code: 'HL2',
    label: 'Compliant: Hazard Level 2',
    short: 'HL2',
    status: 'Compliant',
    color: 'success',
    icon: 'mdi-shield-check-outline',
    level: 2,
    severity: 5,
  },
  HL3: {
    code: 'HL3',
    label: 'Compliant: Hazard Level 3',
    short: 'HL3',
    status: 'Compliant',
    color: 'success',
    icon: 'mdi-shield-check-outline',
    level: 3,
    severity: 6,
  },
}

/** Display order of the hazard level filter chips */
export const HAZARD_LEVEL_ORDER: HazardLevelCode[] = ['HL3', 'HL2', 'HL1', 'AFNR', 'MTR', 'NC', 'unknown']

const CODES_BY_VALUE_ID: Array<[RegExp, HazardLevelCode]> = [
  [/\/HazardLevelValue\/HL1(?:\/|$)/i, 'HL1'],
  [/\/HazardLevelValue\/HL2(?:\/|$)/i, 'HL2'],
  [/\/HazardLevelValue\/HL3(?:\/|$)/i, 'HL3'],
  [/\/HazardLevelValue\/AFNR(?:\/|$)/i, 'AFNR'],
  [/\/HazardLevelValue\/MTR(?:\/|$)/i, 'MTR'],
  [/\/HazardLevelValue\/NC(?:\/|$)/i, 'NC'],
]

/**
 * Determines the hazard level of a `HazardLevel` Property. The `valueId` (IDTA 02102 Table 6) wins;
 * otherwise the value text is matched tolerantly (case, quotes, "HL3" and "Hazard Level 3" spellings).
 */
export function parseHazardLevel (value: string, valueIds: string[] = []): HazardLevel {
  const raw = stripQuotes(value)

  for (const valueId of valueIds) {
    const match = CODES_BY_VALUE_ID.find(([pattern]) => pattern.test(valueId))
    if (match) {
      return { code: match[1], raw }
    }
  }

  const text = raw.toLowerCase()
  let code: HazardLevelCode = 'unknown'
  if (/\bnot[\s-]+compliant\b|\bnon[\s-]*compliant\b/.test(text)) {
    code = 'NC'
  } else if (/\bmissing\b.+\btest\b/.test(text)) {
    code = 'MTR'
  } else if (/\bfunctional\s+necessity\b/.test(text)) {
    code = 'AFNR'
  } else {
    const level = text.match(/hazard\s*level\s*([1-3])\b|\bhl\s*([1-3])\b/)
    if (level) {
      code = `HL${level[1] ?? level[2]}` as HazardLevelCode
    }
  }

  return { code, raw }
}

export function hazardLevelMeta (code: HazardLevelCode): HazardLevelMeta {
  return META[code]
}
