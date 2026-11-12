import type { SnackbarType } from '@/types/Application'
import type { BaSyxComponentKey } from '@/types/BaSyx'

const collectionPaths: Partial<Record<BaSyxComponentKey, string>> = {
  AASRepo: '/shells',
  AASRegistry: '/shell-descriptors',
  SubmodelRepo: '/submodels',
}

export function isCoveredBackendRequest (
  request: SnackbarType['networkRequest'],
  sources: ReadonlyArray<{ component: BaSyxComponentKey, url: string }>,
): boolean {
  if (!request) {
    return false
  }

  const requestUrl = parseHttpUrl(request.url)
  if (!requestUrl) {
    return false
  }

  return sources.some(source => {
    const collectionPath = collectionPaths[source.component]
    const sourceUrl = parseHttpUrl(source.url)
    if (!collectionPath || !sourceUrl || requestUrl.origin !== sourceUrl.origin) {
      return false
    }

    const sourcePath = normalizePath(sourceUrl.pathname)
    const collection = sourcePath.endsWith(collectionPath) ? sourcePath : `${sourcePath}${collectionPath}`
    const requestPath = normalizePath(requestUrl.pathname)
    if (request.operation === 'read') {
      return requestPath === collection
    }
    if (request.component !== source.component) {
      return false
    }

    const description = `${collection.slice(0, -collectionPath.length)}/description`
    return requestPath === collection || requestPath === description
  })
}

function parseHttpUrl (url: string): URL | undefined {
  try {
    const parsed = new URL(url, window.location.origin)
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed
      : undefined
  } catch {
    return undefined
  }
}

function normalizePath (path: string): string {
  return path.replace(/\/+$/, '')
}
