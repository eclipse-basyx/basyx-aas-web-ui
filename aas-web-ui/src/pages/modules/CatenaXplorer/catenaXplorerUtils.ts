export interface AssetIdFilterOption {
  name: string
  value: string
}

export interface EndpointRow {
  interfaceName: string
  href: string
  endpointProtocol: string
}

function toTrimmedString (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueValues (values: string[]): string[] {
  return Array.from(new Set(values.filter(value => value.trim() !== '')))
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

export function getDescriptorStats (descriptors: any[]): { descriptorCount: number } {
  return {
    descriptorCount: descriptors.length,
  }
}

export function getDescriptorLastUpdatedAt (descriptor: any): string {
  const candidates = [
    descriptor?.updatedAt,
    descriptor?.lastUpdatedAt,
    descriptor?.lastModifiedAt,
    descriptor?.lastModificationDate,
    descriptor?.lastModified,
    descriptor?.modifiedAt,
    descriptor?.modified,
    descriptor?.createdAt,
  ]

  return candidates.map(candidate => toTrimmedString(candidate)).find(candidate => candidate !== '') ?? ''
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
