import { base64Encode } from '@/utils/EncodeDecodeUtils'

export interface AssetIdFilterOption {
  name: string
  value: string
}

export interface EndpointRow {
  interfaceName: string
  href: string
  endpointProtocol: string
}

export interface DescriptorTimestampInfo {
  label: 'Created' | 'Updated'
  value: string
}

export interface SubmodelEdcEndpointInfo {
  assetId: string
  dspEndpoint: string
  href: string
  subprotocolBody: string
}

export interface EdcSubmodelViewState {
  data?: unknown
  error?: string
  isLoading?: boolean
}

export const defaultAssetIdNameSuggestions = [
  'manufacturerId',
  'manufacturerPartId',
  'customerPartId',
  'digitalTwinType',
  'partInstanceId',
  'intrinsicId',
  'batchId',
  'van',
  'parentOrderNumber',
  'jisNumber',
  'jisCallDate',
  'globalAssetId',
]

function toTrimmedString (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueValues (values: string[]): string[] {
  return Array.from(new Set(values.filter(value => value.trim() !== '')))
}

function getShellDescriptorsEndpointUrl (dtrUrl: string): string {
  const normalizedUrl = toTrimmedString(dtrUrl).replace(/\/+$/, '')

  if (normalizedUrl === '') {
    return '/shell-descriptors'
  }

  if (normalizedUrl.endsWith('/shell-descriptors')) {
    return normalizedUrl
  }

  return `${normalizedUrl}/shell-descriptors`
}

export function buildShellDescriptorEndpointUrl (dtrUrl: string, descriptorId: string): string {
  const id = toTrimmedString(descriptorId)
  if (id === '') {
    return ''
  }

  return `${getShellDescriptorsEndpointUrl(dtrUrl)}/${base64Encode(id)}`
}

function quoteShellArgument (value: string): string {
  return `'${value.replace(/'/g, String.raw`'\''`)}'`
}

export function buildShellDescriptorsRequestUrl (
  dtrUrl: string,
  assetIdName: string,
  assetIdValue: string,
  limit = 100,
): string {
  const queryParams = new URLSearchParams()
  queryParams.set('limit', String(limit))

  const name = toTrimmedString(assetIdName)
  const value = toTrimmedString(assetIdValue)
  if (name !== '' && value !== '') {
    queryParams.append('assetIds', base64Encode(JSON.stringify({ name, value })))
  }

  return `${getShellDescriptorsEndpointUrl(dtrUrl)}?${queryParams.toString()}`
}

export function buildShellDescriptorsCurlCommand (
  dtrUrl: string,
  assetIdName: string,
  assetIdValue: string,
  authorizationHeader?: string,
): string {
  return [
    `curl -X GET ${quoteShellArgument(buildShellDescriptorsRequestUrl(dtrUrl, assetIdName, assetIdValue))}`,
    ...buildAuthorizationHeaderLine(authorizationHeader),
  ].join(' \\\n')
}

export function buildEdcShellDescriptorsCurlCommand (
  endpointUrl: string,
  counterPartyId: string,
  counterPartyAddress: string,
  protocol: string,
  assetIdName: string,
  assetIdValue: string,
  transferProcessId?: string,
  authorizationHeader?: string,
): string {
  const requestBody: Record<string, unknown> = {
    counterPartyId: toTrimmedString(counterPartyId),
    counterPartyAddress: toTrimmedString(counterPartyAddress),
    protocol: toTrimmedString(protocol),
    limit: 100,
  }
  const name = toTrimmedString(assetIdName)
  const value = toTrimmedString(assetIdValue)
  if (name !== '' && value !== '') {
    requestBody.assetIds = [{ name, value }]
  }

  const normalizedTransferProcessId = toTrimmedString(transferProcessId)
  if (normalizedTransferProcessId !== '') {
    requestBody.transferProcessId = normalizedTransferProcessId
  }

  return [
    `curl -X POST ${quoteShellArgument(endpointUrl)}`,
    `  -H ${quoteShellArgument('Content-Type: application/json')}`,
    ...buildAuthorizationHeaderLine(authorizationHeader),
    `  --data-raw ${quoteShellArgument(JSON.stringify(requestBody))}`,
  ].join(' \\\n')
}

function buildAuthorizationHeaderLine (authorizationHeader?: string): string[] {
  const normalizedHeader = toTrimmedString(authorizationHeader)
  return normalizedHeader === ''
    ? []
    : [`  -H ${quoteShellArgument(`Authorization: ${normalizedHeader}`)}`]
}

export function asArray<T = any> (value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (value && typeof value === 'object') {
    return [value as T]
  }

  return []
}

export function getDescriptorTitle (descriptor: any): string {
  return toTrimmedString(descriptor?.idShort) || toTrimmedString(descriptor?.id) || 'AAS Descriptor'
}

export function getDescriptorKey (descriptor: any): string {
  return descriptor?.id ?? getDescriptorTitle(descriptor)
}

export function displayValue (value: unknown): string {
  if (value === undefined || value === null) {
    return '-'
  }

  const text = String(value).trim()
  return text === '' ? '-' : text
}

export function formatDateTime (value: unknown): string {
  const text = displayValue(value)
  if (text === '-') {
    return text
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString()
}

export function getLangStringText (value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    return value
      .map(item => toTrimmedString(item?.text) || toTrimmedString(item?.value))
      .filter(text => text !== '')
      .join(', ')
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return toTrimmedString(record.text) || toTrimmedString(record.value)
  }

  return ''
}

export function getSpecificAssetIds (descriptor: any): any[] {
  return Array.isArray(descriptor?.specificAssetIds) ? descriptor.specificAssetIds : []
}

export function getSubmodelDescriptors (descriptor: any): any[] {
  return Array.isArray(descriptor?.submodelDescriptors) ? descriptor.submodelDescriptors : []
}

export function getAssetIdNameSuggestions (descriptors: any[]): string[] {
  const names: string[] = []

  for (const descriptor of descriptors) {
    if (toTrimmedString(descriptor?.globalAssetId) !== '') {
      names.push('globalAssetId')
    }

    for (const specificAssetId of getSpecificAssetIds(descriptor)) {
      const name = toTrimmedString(specificAssetId?.name)
      if (name !== '') {
        names.push(name)
      }
    }
  }

  return uniqueValues(names).toSorted((a, b) => a.localeCompare(b))
}

export function buildAssetIdNameSuggestions (descriptors: any[], knownAssetIdNames: string[] = []): string[] {
  const defaultSuggestionNames = new Set(defaultAssetIdNameSuggestions)
  const discoveredSuggestions = uniqueValues([
    ...knownAssetIdNames,
    ...getAssetIdNameSuggestions(descriptors),
  ])
    .filter(assetIdName => !defaultSuggestionNames.has(assetIdName))
    .toSorted((a, b) => a.localeCompare(b))

  return [
    ...defaultAssetIdNameSuggestions,
    ...discoveredSuggestions,
  ]
}

export function getSpecificAssetIdNameSuggestions (assetIdNameSuggestions: string[]): string[] {
  return uniqueValues(assetIdNameSuggestions)
    .filter(assetIdName => assetIdName !== 'globalAssetId')
}

export function getDescriptorStats (descriptors: any[]): { descriptorCount: number } {
  return {
    descriptorCount: descriptors.length,
  }
}

export function getDescriptorLastUpdatedAt (descriptor: any): string {
  return getDescriptorTimestampInfo(descriptor)?.value ?? ''
}

export function getDescriptorTimestampInfo (descriptor: any): DescriptorTimestampInfo | null {
  const candidates = [
    descriptor?.updatedAt,
    descriptor?.lastUpdatedAt,
    descriptor?.lastModifiedAt,
    descriptor?.lastModificationDate,
    descriptor?.lastModified,
    descriptor?.modifiedAt,
    descriptor?.modified,
  ]
  const updatedAt = candidates.map(candidate => toTrimmedString(candidate)).find(candidate => candidate !== '') ?? ''
  if (updatedAt !== '') {
    return {
      label: 'Updated',
      value: updatedAt,
    }
  }

  const createdAt = toTrimmedString(descriptor?.createdAt)
  return createdAt === ''
    ? null
    : {
        label: 'Created',
        value: createdAt,
      }
}

export function getEndpointRows (endpoints: unknown): EndpointRow[] {
  return asArray<any>(endpoints)
    .map(endpoint => ({
      interfaceName: toTrimmedString(endpoint?.interface) || '-',
      href: toTrimmedString(endpoint?.protocolInformation?.href),
      endpointProtocol: toTrimmedString(endpoint?.protocolInformation?.endpointProtocol),
    }))
    .filter(endpoint => endpoint.href !== '')
}

export function getReferenceKeyValues (reference: unknown): string[] {
  const record = reference as { keys?: Array<{ value?: unknown }> } | undefined
  if (!Array.isArray(record?.keys)) {
    return []
  }

  return uniqueValues(record.keys.map(key => toTrimmedString(key?.value)))
}

export function getExternalSubjectMarkerValues (assetId: any): string[] {
  return getReferenceKeyValues(assetId?.externalSubjectId)
}

export function normalizeSupplementalSemanticIds (submodelDescriptor: any): any[] {
  return [
    ...asArray(submodelDescriptor?.supplementalSemanticIds),
    ...asArray(submodelDescriptor?.supplementalSemanticId),
  ]
}

export function getSubmodelMarkerValues (submodelDescriptor: any): string[] {
  return uniqueValues(
    normalizeSupplementalSemanticIds(submodelDescriptor).flatMap(reference => getReferenceKeyValues(reference)),
  )
}

export function parseSubprotocolBody (value: unknown): Record<string, string> {
  const body = toTrimmedString(value)
  if (body === '') {
    return {}
  }

  const params: Record<string, string> = {}
  for (const segment of body.split(';')) {
    const [rawKey, ...rawValueParts] = segment.split('=')
    const key = toTrimmedString(rawKey)
    const rawValue = rawValueParts.join('=')
    if (key === '' || rawValueParts.length === 0) {
      continue
    }
    params[key] = toTrimmedString(rawValue)
  }

  return params
}

export function getSubmodelEdcEndpointInfo (submodelDescriptor: any): SubmodelEdcEndpointInfo | null {
  const endpoints = asArray<any>(submodelDescriptor?.endpoints)
  const endpoint = endpoints.find(candidate => {
    const protocolInformation = candidate?.protocolInformation
    return toTrimmedString(protocolInformation?.subprotocol).toUpperCase() === 'DSP'
      && toTrimmedString(protocolInformation?.subprotocolBody) !== ''
  }) ?? endpoints.find(candidate => toTrimmedString(candidate?.protocolInformation?.subprotocolBody) !== '')
  const protocolInformation = endpoint?.protocolInformation
  const href = toTrimmedString(protocolInformation?.href)
  const subprotocolBody = toTrimmedString(protocolInformation?.subprotocolBody)
  const params = parseSubprotocolBody(subprotocolBody)
  const assetId = params.id
  const dspEndpoint = params.dspEndpoint

  if (href === '' || subprotocolBody === '' || !assetId || !dspEndpoint) {
    return null
  }

  return {
    assetId,
    dspEndpoint,
    href,
    subprotocolBody,
  }
}
