import type { BaSyxComponentKey } from '@/types/BaSyx'
import { normalizeBaseUrl, stripLastSegmentOf } from '@/utils/url'
import { ABAC_ENDPOINT_PATHS, ABAC_ROUTE_PATHS, COMPONENT_PATH_CHECK } from '../constants/api'

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
