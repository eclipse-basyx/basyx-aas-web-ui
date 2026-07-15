export type OpenIdConfiguration = {
  issuer?: string
  authorization_endpoint?: string
  token_endpoint?: string
  end_session_endpoint?: string
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
