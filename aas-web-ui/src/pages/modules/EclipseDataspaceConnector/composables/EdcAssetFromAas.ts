import type { CatenaXEdcAsset } from '@/composables/Client/CatenaXEdcClient'
import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
import AssetTemplateDefault from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset.json'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

/**
 * OAuth2 values of the data address of an EDC Asset, empty values are left out of the asset.
 */
export interface EdcAssetOAuth2 {
  clientId: string
  clientSecretKey: string // Key of the client secret in the EDC vault, not the secret itself
  tokenUrl: string
  scope: string
}

export function createEmptyEdcAssetOAuth2 (): EdcAssetOAuth2 {
  return { clientId: '', clientSecretKey: '', tokenUrl: '', scope: '' }
}

export function hasEdcAssetOAuth2 (oauth2: EdcAssetOAuth2): boolean {
  return Object.values(oauth2).some(value => value.trim() !== '')
}

/**
 * Replaces the placeholders ("{{Label|Placeholder|Hint}}") of a template with the values given for their labels.
 * Properties whose placeholder gets no value are removed.
 */
export function fillTemplatePlaceholders (template: unknown, values: Record<string, string>): unknown {
  if (typeof template === 'string') {
    const match = template.match(/^\{\{([^|}]*)(?:\|[^}]*)?\}\}$/)
    if (!match) {
      return template
    }
    return values[match[1].trim()] || undefined
  }
  if (Array.isArray(template)) {
    return template
      .map(item => fillTemplatePlaceholders(item, values))
      .filter(item => item !== undefined)
  }
  if (template !== null && typeof template === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(template)) {
      const filledValue = fillTemplatePlaceholders(value, values)
      if (filledValue !== undefined) {
        result[key] = filledValue
      }
    }
    return result
  }
  return template
}

const EDC_NAMESPACE = 'https://w3id.org/edc/v0.0.1/ns/'
const CX_COMMON_NAMESPACE = 'https://w3id.org/catenax/ontology/common#'
const CX_TAXO_NAMESPACE = 'https://w3id.org/catenax/taxonomy#'
// eslint-disable-next-line unicorn/prefer-https -- The Dublin Core namespace is an exact identifier required by CX-0002.
const DCT_NAMESPACE = 'http://purl.org/dc/terms/'

/**
 * Returns the IRI of an AAS class (e.g. `HasSemantics`) in the given AAS specification version (e.g. `3.0`).
 */
function aasClassIri (version: string, aasClass: string): string {
  return 'https://admin-shell.io/aas/' + version.replace('.', '/') + '/' + aasClass
}

/**
 * Returns the namespace of the attributes of an AAS class (e.g. `HasSemantics`) in the given AAS specification version.
 */
function aasNamespace (version: string, aasClass: string): string {
  return aasClassIri(version, aasClass) + '/'
}

/**
 * Returns the major and minor version of the AAS specification implemented by an endpoint interface
 * (e.g. `SUBMODEL-3.1.2` → `3.1`). Falls back to version 3.0, the minimum version supported by Catena-X.
 */
export function aasSpecVersion (endpointInterface?: string): string {
  const match = /-(\d+)\.(\d+)(?:\.\d+)*$/.exec(endpointInterface ?? '')
  return match && Number(match[1]) >= 3 ? `${match[1]}.${match[2]}` : '3.0'
}

/**
 * Adds the JSON-LD property `"prefix:name": value` and its prefix to the `@context` of an EDC Asset.
 */
function addEdcAssetProperty (asset: CatenaXEdcAsset, prefix: string, namespace: string, name: string, value: unknown): void {
  asset['@context'] = { ...(asset['@context'] as Record<string, string>), [prefix]: namespace }
  asset.properties[prefix + ':' + name] = value
}

/**
 * Adds the AAS attributes of an Identifiable as JSON-LD properties to an EDC Asset,
 * using the `aas-*` namespaces of the given AAS specification version (e.g. `3.0`):
 * `aas-identifiables:id`, `aas-referables:idShort`, `aas-referables:displayName`, `aas-referables:description`,
 * Catena-X `aas-semantics:semanticId` (CX-0002) and `aas-semantics:supplementalSemanticId`. Empty attributes are left out.
 * LangStrings are nodes as in the AAS RDF serialization, since the EDC reduces JSON-LD value objects
 * (`@value`/`@language`) of asset properties to their plain value and drops the language.
 */
function addAasProperties (asset: CatenaXEdcAsset, identifiable: any, version: string): void {
  const langStrings = (langStringSet: any, langStringType: string): Array<Record<string, string>> =>
    (Array.isArray(langStringSet) ? langStringSet : [])
      .filter((langString: any) => langString?.text)
      .map((langString: any) => ({
        '@type': aasClassIri(version, langStringType),
        'aas-langstrings:language': langString.language,
        'aas-langstrings:text': langString.text,
      }))
  const referenceValue = (reference: any): string | undefined => reference?.keys?.[0]?.value

  if (identifiable?.id) {
    addEdcAssetProperty(asset, 'aas-identifiables', aasNamespace(version, 'Identifiable'), 'id', { '@id': identifiable.id })
  }
  if (identifiable?.idShort) {
    addEdcAssetProperty(asset, 'aas-referables', aasNamespace(version, 'Referable'), 'idShort', { '@id': identifiable.idShort })
  }
  for (const [name, langStringType] of [['displayName', 'LangStringNameType'], ['description', 'LangStringTextType']]) {
    const values = langStrings(identifiable?.[name], langStringType)
    if (values.length > 0) {
      asset['@context'] = {
        ...(asset['@context'] as Record<string, string>),
        'aas-langstrings': aasNamespace(version, 'AbstractLangString'),
      }
      addEdcAssetProperty(asset, 'aas-referables', aasNamespace(version, 'Referable'), name, values)
    }
  }
  const semanticId = referenceValue(identifiable?.semanticId)
  if (semanticId) {
    addEdcAssetProperty(asset, 'aas-semantics', aasNamespace(version, 'HasSemantics'), 'semanticId', { '@id': semanticId })
  }
  const supplementalSemanticIds = (Array.isArray(identifiable?.supplementalSemanticIds) ? identifiable.supplementalSemanticIds : [])
    .map((reference: any) => referenceValue(reference))
    .filter(Boolean)
  if (supplementalSemanticIds.length > 0) {
    addEdcAssetProperty(
      asset,
      'aas-semantics',
      aasNamespace(version, 'HasSemantics'),
      'supplementalSemanticId',
      supplementalSemanticIds.map((id: string) => ({ '@id': id })),
    )
  }
}

export function useEdcAssetFromAas () {
  // Composables
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { smTitleToDisplay } = useSubmodelDisplay()

  /**
   * Creates the EDC Asset of an Identifiable pointing to its first endpoint, proxying only paths below it
   * (`proxyPath`), but neither body, method nor query parameters of consumer requests.
   * The `@context` declares the EDC and Catena-X prefixes, the AAS attributes of the Identifiable are added as properties,
   * in the `aas-*` namespace version matching the interface version of the endpoint.
   */
  function createEdcAsset (
    identifiable: any,
    displayName: string,
    oauth2: EdcAssetOAuth2 = createEmptyEdcAssetOAuth2(),
  ): CatenaXEdcAsset {
    const endpoint = identifiable?.endpoints?.[0]
    const asset = fillTemplatePlaceholders(AssetTemplateDefault, {
      'Asset ID': base64Encode(identifiable.id),
      'Asset Display Name': displayName,
      'Asset Description': descriptionToDisplay(identifiable, 'en'),
      'Asset Endpoint': endpoint?.protocolInformation?.href ?? '',
      'Endpoint client ID': oauth2.clientId.trim(),
      'Endpoint client secret key': oauth2.clientSecretKey.trim(),
      'Token endpoint': oauth2.tokenUrl.trim(),
      'Token scope': oauth2.scope.trim(),
    }) as CatenaXEdcAsset
    // Let consumers only read the endpoint and paths below it, e.g. Submodel elements
    asset.dataAddress = {
      '@type': 'DataAddress',
      ...asset.dataAddress,
      'proxyPath': 'true',
      'proxyBody': 'false',
      'proxyMethod': 'false',
      'proxyQueryParams': 'false',
    }

    const version = aasSpecVersion(endpoint?.interface)
    asset['@context'] = {
      ...(asset['@context'] as Record<string, string>),
      'edc': EDC_NAMESPACE,
      'cx-common': CX_COMMON_NAMESPACE,
      'cx-taxo': CX_TAXO_NAMESPACE,
      'dct': DCT_NAMESPACE,
      'aas-semantics': aasNamespace(version, 'HasSemantics'),
    }

    addAasProperties(asset, identifiable, version)
    return asset
  }

  /**
   * Creates the EDC Asset of an AAS, pointing to the AAS endpoint.
   */
  function createAasEdcAsset (aas: any, oauth2?: EdcAssetOAuth2): CatenaXEdcAsset {
    return createEdcAsset(aas, nameToDisplay(aas, 'en'), oauth2)
  }

  /**
   * Creates the EDC Asset of a Submodel of an AAS, pointing to the Submodel endpoint.
   * As required by Catena-X (CX-0002) for a single Submodel registered as Dataset, the asset is typed as
   * `cx-taxo:Submodel` (`dct:type`) and carries the AAS specification version of the endpoint (`cx-common:version`).
   */
  function createSmEdcAsset (aas: any, sm: any, oauth2?: EdcAssetOAuth2): CatenaXEdcAsset {
    const asset = createEdcAsset(sm, nameToDisplay(aas, 'en') + ' - SM ' + smTitleToDisplay(sm), oauth2)
    addEdcAssetProperty(asset, 'dct', DCT_NAMESPACE, 'type', { '@id': CX_TAXO_NAMESPACE + 'Submodel' })
    addEdcAssetProperty(asset, 'cx-common', CX_COMMON_NAMESPACE, 'version', aasSpecVersion(sm?.endpoints?.[0]?.interface))
    return asset
  }

  return {
    createAasEdcAsset,
    createSmEdcAsset,
  }
}
