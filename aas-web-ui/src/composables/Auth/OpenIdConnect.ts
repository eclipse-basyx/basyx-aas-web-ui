export type OpenIdConfiguration = {
  issuer?: string
  authorization_endpoint?: string
  token_endpoint?: string
  end_session_endpoint?: string
}

const entraTenantPlaceholder = '{tenantid}'
const entraTenantIdPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i

/**
 * Compares a callback issuer with discovery metadata. OpenID Connect normally
 * requires an exact match. Microsoft Entra tenant-independent metadata is the
 * documented exception and publishes a single `{tenantid}` UUID placeholder.
 */
export function oidcIssuersMatch (discoveredIssuer: string, callbackIssuer: string): boolean {
  if (discoveredIssuer === callbackIssuer) {
    return true
  }

  const normalizedIssuer = discoveredIssuer.toLowerCase()
  const placeholderIndex = normalizedIssuer.indexOf(entraTenantPlaceholder)
  if (
    placeholderIndex === -1
    || normalizedIssuer.slice(placeholderIndex + entraTenantPlaceholder.length).includes(entraTenantPlaceholder)
  ) {
    return false
  }

  const prefix = discoveredIssuer.slice(0, placeholderIndex)
  const suffix = discoveredIssuer.slice(placeholderIndex + entraTenantPlaceholder.length)
  if (!callbackIssuer.startsWith(prefix) || !callbackIssuer.endsWith(suffix)) {
    return false
  }

  const tenantId = callbackIssuer.slice(prefix.length, callbackIssuer.length - suffix.length)
  return entraTenantIdPattern.test(tenantId)
}

/**
 * Loads provider metadata from the configured OIDC issuer. Endpoint paths are
 * never guessed because they are not portable between identity providers.
 */
export async function discoverOpenIdConfiguration (issuer: string): Promise<OpenIdConfiguration> {
  const issuerUrl = new URL(issuer)
  if (!['http:', 'https:'].includes(issuerUrl.protocol)) {
    throw new Error('OIDC issuer must use HTTP or HTTPS')
  }

  issuerUrl.pathname = `${issuerUrl.pathname.replace(/\/$/, '')}/.well-known/openid-configuration`
  issuerUrl.search = ''
  issuerUrl.hash = ''

  const response = await fetch(issuerUrl.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenID configuration: ${response.status} ${response.statusText}`)
  }

  return await response.json() as OpenIdConfiguration
}
