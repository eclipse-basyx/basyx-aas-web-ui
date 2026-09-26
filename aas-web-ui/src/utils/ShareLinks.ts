import type { BaSyxComponentKey } from '@/types/BaSyx'

export interface PendingInvitation {
  token: string
  service: string
  component: BaSyxComponentKey
  receivedAt: number
}

const roots: Partial<Record<BaSyxComponentKey, string>> = {
  AASRepo: '/shells',
  SubmodelRepo: '/submodels',
  AASRegistry: '/shell-descriptors',
  SubmodelRegistry: '/submodel-descriptors',
  AASDiscovery: '/lookup/shells',
  ConceptDescriptionRepo: '/concept-descriptions',
}

const tokenPattern = /^[\w-]{43}$/

/** Returns the service root of a component URL, without its API path. */
export function shareServiceUrl (configuredUrl: string, component: BaSyxComponentKey): string {
  const root = roots[component]
  const url = new URL(configuredUrl, window.location.origin)
  if (!root || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid invitation service.')
  }
  url.pathname = url.pathname.replace(/\/+$/, '')
  if (url.pathname.endsWith(root)) {
    url.pathname = url.pathname.slice(0, -root.length)
  }
  return url.href.replace(/\/+$/, '')
}

/** Returns the ReBAC management root (`/security/rebac`) of a component. */
export function managementUrl (configuredUrl: string, component: BaSyxComponentKey): string {
  return `${shareServiceUrl(configuredUrl, component)}/security/rebac`
}

export function parseInvitation (fragment: string): PendingInvitation | undefined {
  if (!fragment.startsWith('#/share-access?')) {
    return undefined
  }
  const params = new URLSearchParams(fragment.slice('#/share-access?'.length))
  const token = params.get('token') ?? ''
  const component = params.get('component') as BaSyxComponentKey
  if (!tokenPattern.test(token) || !roots[component] || !params.get('service')) {
    return undefined
  }
  try {
    const service = shareServiceUrl(params.get('service') ?? '', component)
    return { token, service, component, receivedAt: Date.now() }
  } catch {
    return undefined
  }
}

/**
 * Builds the link that lets the recipient accept an invitation in this UI.
 * The token travels in the URL fragment, so it never reaches a web server log.
 */
export function buildInvitationUrl (token: string, configuredUrl: string, component: BaSyxComponentKey): string {
  if (!tokenPattern.test(token)) {
    throw new Error('Invalid invitation token.')
  }
  const url = new URL(import.meta.env.BASE_URL, window.location.origin)
  url.hash = '/share-access?' + new URLSearchParams({
    token, service: shareServiceUrl(configuredUrl, component), component,
  }).toString()
  return url.href
}
