import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { InfrastructureConfig } from '@/types/Infrastructure'
import { AAS_REPOSITORY_ENDPOINT_PATH, SUBMODEL_REPOSITORY_ENDPOINT_PATH } from '@/utils/EndpointUrls'
import { getActiveComponentUrlForTemplate } from '@/utils/InfrastructureUtils'

/**
 * Repository URL offered for the start of the baseUrl of an Asset, with the infrastructures configuring it.
 */
export interface EdcAssetRepositoryUrlOption {
  value: string
  subtitle: string // e.g. "Local BaSyx: AAS Repository, Submodel Repository"
}

// Start of the endpoint path of an AAS or Submodel, e.g. '/shells/' of '…/shells/{aasId}/submodels/{smId}'
const ENDPOINT_PATH_PATTERN = new RegExp(`(?:${AAS_REPOSITORY_ENDPOINT_PATH}|${SUBMODEL_REPOSITORY_ENDPOINT_PATH})(?:/|$)`)
const REPOSITORY_COMPONENTS: Array<{ key: BaSyxComponentKey, label: string }> = [
  { key: 'AASRepo', label: 'AAS Repository' },
  { key: 'SubmodelRepo', label: 'Submodel Repository' },
]

/**
 * Returns the repository URL without trailing slashes and endpoint path,
 * e.g. 'https://repo.test/api' of 'https://repo.test/api/shells/'.
 */
export function normalizeEdcAssetRepositoryUrl (repositoryUrl: string): string {
  return (repositoryUrl ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(new RegExp(`(?:${AAS_REPOSITORY_ENDPOINT_PATH}|${SUBMODEL_REPOSITORY_ENDPOINT_PATH})$`), '')
    .replace(/\/+$/, '')
}

// Index of the endpoint path in the path of the endpoint, so a host like 'submodels' is no match
function endpointPathIndex (endpoint: string): number {
  const schemeIndex = endpoint.indexOf('://')
  const pathStart = schemeIndex === -1 ? 0 : endpoint.indexOf('/', schemeIndex + 3)
  if (pathStart === -1) {
    return -1
  }

  const match = ENDPOINT_PATH_PATTERN.exec(endpoint.slice(pathStart))
  return match ? pathStart + match.index : -1
}

/**
 * Returns the repository URL an AAS or Submodel endpoint starts with, i.e. the part before its endpoint path,
 * e.g. 'https://repo.test/api' of 'https://repo.test/api/shells/dXJuOmFhcw'. Empty without an endpoint path.
 */
export function edcAssetRepositoryUrl (endpoint: string): string {
  const index = endpointPathIndex(endpoint ?? '')
  return index === -1 ? '' : endpoint.slice(0, index)
}

/**
 * Replaces the repository URL an AAS or Submodel endpoint starts with, keeping its endpoint path,
 * e.g. 'https://repo.test/shells/dXJuOmFhcw' with 'https://repo.intern:8081' → 'https://repo.intern:8081/shells/dXJuOmFhcw'.
 * The endpoint stays unchanged without a repository URL or without an endpoint path.
 */
export function replaceEdcAssetRepositoryUrl (endpoint: string, repositoryUrl: string): string {
  const url = normalizeEdcAssetRepositoryUrl(repositoryUrl)
  const index = endpointPathIndex(endpoint ?? '')
  return url === '' || index === -1 ? endpoint : `${url}${endpoint.slice(index)}`
}

/**
 * Returns the AAS and Submodel Repository URLs of all infrastructures, each URL once,
 * with the infrastructures and components configuring it.
 */
export function edcAssetRepositoryUrlOptions (infrastructures: Array<InfrastructureConfig>): Array<EdcAssetRepositoryUrlOption> {
  const usages = new Map<string, Map<string, Array<string>>>() // URL → infrastructure name → component labels
  for (const infrastructure of infrastructures) {
    for (const { key, label } of REPOSITORY_COMPONENTS) {
      const url = normalizeEdcAssetRepositoryUrl(getActiveComponentUrlForTemplate(infrastructure, key))
      if (url === '') {
        continue
      }

      const infrastructureUsages = usages.get(url) ?? new Map<string, Array<string>>()
      infrastructureUsages.set(infrastructure.name, [...(infrastructureUsages.get(infrastructure.name) ?? []), label])
      usages.set(url, infrastructureUsages)
    }
  }

  return [...usages].map(([value, infrastructureUsages]) => ({
    value,
    subtitle: [...infrastructureUsages].map(([name, labels]) => `${name}: ${labels.join(', ')}`).join('; '),
  }))
}
