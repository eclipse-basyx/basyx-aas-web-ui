import type { BaSyxComponentKey } from '@/types/BaSyx'
import type {
  ResourceAccessTarget,
  ResourceAccessTargetInput,
  ResourceAccessTargetKind,
} from '@/types/ResourceAccess'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

interface TargetDefinition {
  componentKey: BaSyxComponentKey
  root: string
  label: string
}

const definitions: Record<ResourceAccessTargetKind, TargetDefinition> = {
  'aas': { componentKey: 'AASRepo', root: '/shells', label: 'Asset Administration Shell' },
  'submodel': { componentKey: 'SubmodelRepo', root: '/submodels', label: 'Submodel' },
  'nested-submodel': { componentKey: 'AASRepo', root: '/shells', label: 'Submodel in an AAS' },
  'submodel-element': { componentKey: 'SubmodelRepo', root: '/submodels', label: 'Submodel Element' },
  'nested-submodel-element': { componentKey: 'AASRepo', root: '/shells', label: 'Submodel Element in an AAS' },
  'aas-descriptor': { componentKey: 'AASRegistry', root: '/shell-descriptors', label: 'AAS descriptor' },
  'nested-submodel-descriptor': { componentKey: 'AASRegistry', root: '/shell-descriptors', label: 'Nested Submodel descriptor' },
  'submodel-descriptor': { componentKey: 'SubmodelRegistry', root: '/submodel-descriptors', label: 'Submodel descriptor' },
  'discovery': { componentKey: 'AASDiscovery', root: '/lookup/shells', label: 'AAS Discovery entry' },
  'concept-description': { componentKey: 'ConceptDescriptionRepo', root: '/concept-descriptions', label: 'Concept Description' },
}

export const resourceAccessTargetOptions = Object.entries(definitions).map(([value, definition]) => ({
  title: definition.label,
  componentKey: definition.componentKey,
  value: value as ResourceAccessTargetKind,
}))

export function buildResourceAccessTarget (input: ResourceAccessTargetInput): ResourceAccessTarget {
  const definition = definitions[input.kind]
  if (!definition) {
    throw new Error('Resource access is only supported for individual resources.')
  }
  const rootEndpoint = ensureEndpointRoot(input.baseUrl, definition.root)
  const endpoint = buildConcreteEndpoint(input, rootEndpoint)

  return {
    kind: input.kind,
    label: buildLabel(input, definition),
    endpoint,
    componentKey: definition.componentKey,
  }
}

export function accessEndpoint (target: ResourceAccessTarget): string {
  return `${target.endpoint.replace(/\/$/, '')}/$access`
}

function buildConcreteEndpoint (input: ResourceAccessTargetInput, rootEndpoint: string): string {
  switch (input.kind) {
    case 'aas':
    case 'aas-descriptor':
    case 'submodel':
    case 'submodel-descriptor':
    case 'discovery':
    case 'concept-description': {
      return `${rootEndpoint}/${encodeRequired(input.resourceId, 'resource ID')}`
    }
    case 'submodel-element': {
      return `${rootEndpoint}/${encodeRequired(input.submodelId, 'Submodel ID')}/submodel-elements/${encodePath(input.idShortPath)}`
    }
    case 'nested-submodel': {
      return `${rootEndpoint}/${encodeRequired(input.aasId, 'AAS ID')}/submodels/${encodeRequired(input.submodelId, 'Submodel ID')}`
    }
    case 'nested-submodel-element': {
      return `${rootEndpoint}/${encodeRequired(input.aasId, 'AAS ID')}/submodels/${encodeRequired(input.submodelId, 'Submodel ID')}/submodel-elements/${encodePath(input.idShortPath)}`
    }
    case 'nested-submodel-descriptor': {
      return `${rootEndpoint}/${encodeRequired(input.aasId, 'AAS ID')}/submodel-descriptors/${encodeRequired(input.submodelId, 'Submodel ID')}`
    }
    default: {
      throw new Error('Resource access requires an individual resource.')
    }
  }
}

function buildLabel (input: ResourceAccessTargetInput, definition: TargetDefinition): string {
  const identity = input.idShortPath || input.resourceId || input.submodelId || input.aasId
  return identity ? `${definition.label}: ${identity}` : definition.label
}

function ensureEndpointRoot (baseUrl: string, root: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (!normalized) {
    throw new Error('The component endpoint is not configured.')
  }
  return normalized.endsWith(root) ? normalized : `${normalized}${root}`
}

function encodeRequired (value: string | undefined, name: string): string {
  const encoded = base64Encode(value ?? '')
  if (!encoded) {
    throw new Error(`${name} is required.`)
  }
  return encoded
}

function encodePath (value: string | undefined): string {
  const path = value?.trim()
  if (!path) {
    throw new Error('ID-short path is required.')
  }
  return encodeURIComponent(path)
}
