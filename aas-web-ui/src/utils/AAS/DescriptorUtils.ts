/**
 * Extracts the endpoint from a descriptor based on the given interface short name.
 * AAS and Submodel 3.x requests also accept other numeric 3.x versions,
 * preferring exact matches and direct interfaces over repository fallbacks.
 *
 * @param {Object} descriptor_or_model - The descriptor or model (AAS / Submodel) containing endpoint information.
 * @param {string} interfaceShortName - The short name of the interface to match against endpoint interfaces.
 * @returns {string} The href of the matching endpoint's protocol information if found, otherwise an empty string.
 */
export function extractEndpointHref (descriptor_or_model: any, interfaceShortName: string): string {
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

  // First, try to find exact match
  let endpoint = endpoints.find((endpoint: any) => {
    return endpoint?.interface === interfaceShortName
  })

  const versionedInterface = /^(AAS|SUBMODEL)-(3\.\d+(?:\.\d+)*)$/.exec(interfaceShortName)
  if (!endpoint && versionedInterface) {
    const [, interfaceName, version] = versionedInterface
    const directInterfacePattern = new RegExp(String.raw`^${interfaceName}-3\.\d+(?:\.\d+)*$`)
    const repositoryInterfacePattern = new RegExp(String.raw`^${interfaceName}-REPOSITORY-3\.\d+(?:\.\d+)*$`)

    endpoint = endpoints.find((endpoint: any) => directInterfacePattern.test(endpoint?.interface))
      ?? endpoints.find((endpoint: any) => endpoint?.interface === `${interfaceName}-REPOSITORY-${version}`)
      ?? endpoints.find((endpoint: any) => repositoryInterfacePattern.test(endpoint?.interface))
  }

  return endpoint?.protocolInformation?.href || ''
}
