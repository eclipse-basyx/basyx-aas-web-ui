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

export function parseInvitation (fragment: string): PendingInvitation | undefined {
  if (!fragment.startsWith('#/share-access?')) {
    return undefined
  }
  const params = new URLSearchParams(fragment.slice('#/share-access?'.length))
  const token = params.get('token') ?? ''
  const component = params.get('component') as BaSyxComponentKey
  if (!/^[\w-]{43}$/.test(token) || !roots[component]) {
    return undefined
  }
  try {
    const service = shareServiceUrl(params.get('service') ?? '', component)
    if (!params.get('service')) {
      return undefined
    }
    return { token, service, component, receivedAt: Date.now() }
  } catch {
    return undefined
  }
}

export function buildInvitationUrl (fragment: string, configuredUrl: string, component: BaSyxComponentKey): string {
  const token = new URLSearchParams(fragment.split('?', 2)[1]).get('token') ?? ''
  if (!fragment.startsWith('#/share-access?') || !/^[\w-]{43}$/.test(token)) {
    throw new Error('Invalid invitation response.')
  }
  const url = new URL(import.meta.env.BASE_URL, window.location.origin)
  url.hash = '/share-access?' + new URLSearchParams({
    token, service: shareServiceUrl(configuredUrl, component), component,
  }).toString()
  return url.href
}
