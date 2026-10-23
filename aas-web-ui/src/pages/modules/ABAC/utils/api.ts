import type { AbacErrorDetails, AbacErrorMessage } from '../types/api'
import type { JsonErrorMessage } from '../types/json'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { normalizeBaseUrl, stripLastSegmentOf } from '@/utils/url'
import { ABAC_ENDPOINT_PATHS, ABAC_ROUTE_PATHS, COMPONENT_PATH_CHECK } from '../constants/api'
import { isObject } from './object'

/**
 * Builds a URL for a version-scoped path.
 * e.g. buildVersionPath(base, 1, 'rules') → /security/abac/policy-versions/1/rules
 */
export function buildVersionPath (
  baseUrl: string,
  versionId: string,
  ...segments: string[]
): string {
  let path = `${baseUrl}/${ABAC_ROUTE_PATHS.POLICY_VERSIONS}/${versionId}`
  if (segments.length > 0) {
    path += `/${segments.join('/')}`
  }
  return path
}

/**
 * Builds a URL for a rule-scoped action.
 * e.g. buildRuleActionPath(base, 1, 3, 'duplicate') → /security/abac/policy-versions/1/rules/3/duplicate
 */
export function buildRuleActionPath (
  baseUrl: string,
  versionId: string,
  ruleIndex: string,
  action: string,
): string {
  return `${buildVersionPath(baseUrl, versionId, ABAC_ROUTE_PATHS.RULES, String(ruleIndex))}/${action}`
}

export function jsonHeaders (): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  return headers
}

export function toJson (body: unknown): string {
  return JSON.stringify(body)
}

/**
 * Extracts human-readable backend error text from common error payloads:
 * BaSyx-style arrays (`[{ messageType, text, code, ... }]`) and plain objects
 * (`{ message | error | text }`). Returns undefined when nothing usable exists.
 */
export function backendErrorMessage (data: unknown): string | undefined {
  const entries: unknown[] = Array.isArray(data) ? data : [data]
  const texts = entries
    .map(entry => {
      if (typeof entry === 'string') {
        return entry.trim()
      }
      if (typeof entry !== 'object' || entry === null) {
        return undefined
      }
      const source = entry as Record<string, unknown>
      const text = source.text ?? source.message ?? source.error
      return typeof text === 'string' && text.trim() !== '' ? text.trim() : undefined
    })
    .filter((text): text is string => typeof text === 'string' && text !== '')

  return texts.length > 0 ? texts.join('\n') : undefined
}

/**
 * Returns candidate ABAC URL from a basyx component URL.
 *
 * Uses the same approach as `connectComponent` in InfrastructureStore:
 * strip the known component endpoint suffix (pathCheck) to derive the
 * context path, then append /security/abac. Falls back to the raw
 * component URL if the component key has no known pathCheck mapping.
 */
export function buildAbacUrl (componentUrl: string, componentKey: BaSyxComponentKey): string | undefined {
  const stripped = stripLastSegmentOf(componentUrl, COMPONENT_PATH_CHECK[componentKey])
  const candidate = normalizeBaseUrl(stripped, ABAC_ENDPOINT_PATHS.SECURITY)
  return candidate
}

/**
 * Retains transport status and validated backend diagnostics through query/mutation
 * failures instead of reducing the response to an unstructured Error message.
 */
export class AbacApiError extends Error {
  readonly status?: number
  readonly messages: AbacErrorMessage[]
  readonly paths?: string[][]

  constructor (message: string, details: AbacErrorDetails) {
    super(message)
    this.name = 'AbacApiError'
    this.status = details.status
    this.messages = details.messages
    this.paths = details.paths
  }
}

/**
 * Accept both BaSyx error envelopes and plain failures. Only the existing,
 * explicit duplicate-definition identifier supplies a legacy field-path fallback.
 * Missing-reference text is matched against fields in the submitted document.
 */
export function createAbacApiError (data: unknown, status?: number, body?: unknown): AbacApiError {
  const entries: unknown[] = Array.isArray(data) ? data : [data]
  const messages: AbacErrorMessage[] = entries.filter(isObject).map(entry => ({
    code: typeof entry.code === 'string' ? entry.code : undefined,
    correlationId: typeof entry.correlationId === 'string' ? entry.correlationId : undefined,
    messageType: typeof entry.messageType === 'string' ? entry.messageType : undefined,
    text: backendErrorMessage(entry),
    timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : undefined,
    paths: readPaths(entry.paths),
  }))
  const message = backendErrorMessage(data) ?? `ABAC request failed with status ${status ?? 'unknown'}`
  const suppliedPaths = messages.flatMap(entry => entry.paths ?? [])
  const duplicateName = messages.some(entry => entry.code === 'ABACPOLICY-DEFINITION-DUPLICATE')
    || /\bABACPOLICY-DEFINITION-DUPLICATE\b/.test(message)
  const paths = suppliedPaths.length > 0 ? suppliedPaths : (duplicateName ? [['name']] : referenceErrorPaths(message, body))
  return new AbacApiError(message, { status, messages, paths })
}

/**
 * Locate a named missing reference in the actual submission. The backend's
 * one-based rule index narrows policy imports; unrelated fields are left alone.
 */
function referenceErrorPaths (message: string, body: unknown): string[][] | undefined {
  const match = /\b(USEATTRIBUTES|USEOBJECTS|USEACL|USEFORMULA)\s+("(?:[^"\\]|\\.)*")\s+not found\b/.exec(message)
  if (!match) {
    return undefined
  }
  let referenceName: string
  try {
    referenceName = JSON.parse(match[2]!)
  } catch {
    return undefined
  }
  const paths: string[][] = []
  function visit (value: unknown, path: string[]): void {
    if (Array.isArray(value)) {
      for (const [index, entry] of value.entries()) {
        visit(entry, [...path, String(index)])
      }
    } else if (isObject(value)) {
      for (const [key, entry] of Object.entries(value)) {
        const next = [...path, key]
        if (key === match![1] && (entry === referenceName || (Array.isArray(entry) && entry.includes(referenceName)))) {
          paths.push(next)
        } else {
          visit(entry, next)
        }
      }
    }
  }
  const policy = isObject(body) && isObject(body.AllAccessPermissionRules)
    ? body.AllAccessPermissionRules
    : undefined
  const ruleNumber = /\brule (\d+):/.exec(message)
  if (policy && ruleNumber) {
    if (!Array.isArray(policy.rules)) {
      return undefined
    }
    const index = Number(ruleNumber[1]) - 1
    if (!Number.isSafeInteger(index) || index < 0 || index >= policy.rules.length) {
      return undefined
    }
    visit(policy.rules[index], ['AllAccessPermissionRules', 'rules', String(index)])
  } else {
    visit(body, [])
  }
  return paths.length > 0 ? paths : undefined
}

/**
 * Converts failures to dialog diagnostics without interpreting backend text in
 * presentation components. Ordinary errors remain usable without field paths.
 */
export function toSaveError (error: unknown, title: string): JsonErrorMessage {
  return {
    title,
    messages: error instanceof Error ? error.message.split('\n') : undefined,
    paths: error instanceof AbacApiError ? error.paths : undefined,
  }
}

function readPaths (value: unknown): string[][] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  return value.filter((path): path is string[] => Array.isArray(path) && path.every(segment => typeof segment === 'string'))
    .map(path => [...path])
}
