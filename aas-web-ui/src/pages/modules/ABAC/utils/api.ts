import { ABAC_ENDPOINT_PATHS, ABAC_ROUTE_PATHS } from '@/pages/modules/ABAC/constants/api'
import { normalizeBaseUrl } from '@/utils/url'

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
 * Build ABAC URL from a basyx component's base URL.
 * Takes the origin of the component URL and appends the ABAC endpoint path.
 */
export function buildAbacUrl (componentUrl: string): string | undefined {
  try {
    const urlObj = new URL(componentUrl)
    const origin = urlObj.origin
    return normalizeBaseUrl(origin, ABAC_ENDPOINT_PATHS.SECURITY)
  } catch {
    return undefined
  }
}
