/**
 * Extracts the endpoint from a descriptor based on the given interface short name.
 * AAS and Submodel 3.x requests also accept other numeric 3.x versions,
 * preferring exact matches and direct interfaces over repository fallbacks.
 *
 * @param {Object} descriptor_or_model - The descriptor or model (AAS / Submodel) containing endpoint information.
 * @param {string} interfaceShortName - The short name of the interface to match against endpoint interfaces.
 * @param {string} preferredHref - An optional configured repository endpoint to prefer when advertised.
 * @returns {string} The href of the matching endpoint's protocol information if found, otherwise an empty string.
 */
export function extractEndpointHref (descriptor_or_model: any, interfaceShortName: string, preferredHref = ''): string {
  const failResponse = ''

  const interfaceShortNames = [
    'AAS',
    'SUBMODEL',
    'SERIALIZE',
    'DESCRIPTION',
    'AASX-FILE',
    'AAS-REGISTRY',
    'SUBMODEL-REGISTRY',
    'AAS-REPOSITORY',
    'SUBMODEL-REPOSITORY',
    'CD-REPOSITORY',
    'AAS-DISCOVERY',
  ]

  if (
    (descriptor_or_model?.modelType == 'AssetAdministrationShell'
      || descriptor_or_model?.modelType == 'Submodel')
    && descriptor_or_model?.path
  ) {
    return descriptor_or_model.path
  }

  if (!interfaceShortName || interfaceShortName.trim() === '') {
    return failResponse
  }

  interfaceShortName = interfaceShortName.trim()
  interfaceShortName = interfaceShortName.toUpperCase()

  if (!interfaceShortNames.some((iShortName: string) => interfaceShortName.startsWith(`${iShortName}-`))) {
    return failResponse
  }

  if (!Array.isArray(descriptor_or_model?.endpoints) || descriptor_or_model?.endpoints.length === 0) {
    return failResponse
  }

  const endpoints = descriptor_or_model.endpoints

  const candidates = endpoints.filter((endpoint: any) => endpoint?.interface === interfaceShortName)

  const versionedInterface = /^(AAS|SUBMODEL)-(3\.\d+(?:\.\d+)*)$/.exec(interfaceShortName)
  if (versionedInterface) {
    const [, interfaceName, version] = versionedInterface
    const directInterfacePattern = new RegExp(String.raw`^${interfaceName}-3\.\d+(?:\.\d+)*$`)
    const repositoryInterfacePattern = new RegExp(String.raw`^${interfaceName}-REPOSITORY-3\.\d+(?:\.\d+)*$`)

    appendMatchingEndpoints(candidates, endpoints, endpoint => directInterfacePattern.test(endpoint?.interface))
    appendMatchingEndpoints(candidates, endpoints, endpoint => endpoint?.interface === `${interfaceName}-REPOSITORY-${version}`)
    appendMatchingEndpoints(candidates, endpoints, endpoint => repositoryInterfacePattern.test(endpoint?.interface))
  }

  const normalizedPreferredHref = normalizeEndpointHref(preferredHref)
  const endpoint = candidates.find((candidate: any) => (
    normalizedPreferredHref !== ''
    && normalizeEndpointHref(candidate?.protocolInformation?.href) === normalizedPreferredHref
  )) ?? candidates[0]

  return endpoint?.protocolInformation?.href || ''
}

function appendMatchingEndpoints (
  candidates: Array<any>,
  endpoints: Array<any>,
  matches: (endpoint: any) => boolean,
): void {
  candidates.push(...endpoints.filter(endpoint => matches(endpoint) && !candidates.includes(endpoint)))
}

function normalizeEndpointHref (href: unknown): string {
  if (typeof href !== 'string' || href.trim() === '') {
    return ''
  }

  const trimmedHref = href.trim()
  try {
    const url = new URL(trimmedHref)
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.toString()
  } catch {
    return trimmedHref.replace(/\/+$/, '')
  }
}
