import type { BaSyxComponentKey } from '@/types/BaSyx'
import type {
  AccessObject,
  ResourceAccessTarget,
  ResourceAccessTargetInput,
  ResourceAccessTargetKind,
} from '@/types/ResourceAccess'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

interface TargetDefinition {
  componentKey: BaSyxComponentKey
  root: string
  label: string
  icon: string
}

export const resourceAccessTargets: Record<ResourceAccessTargetKind, TargetDefinition> = {
  'aas': { componentKey: 'AASRepo', root: '/shells', label: 'Asset Administration Shell', icon: 'custom:aasIcon' },
  'submodel': { componentKey: 'SubmodelRepo', root: '/submodels', label: 'Submodel', icon: 'mdi-folder-outline' },
  'submodel-element': { componentKey: 'SubmodelRepo', root: '/submodels', label: 'Submodel Element', icon: 'mdi-file-tree-outline' },
  'concept-description': { componentKey: 'ConceptDescriptionRepo', root: '/concept-descriptions', label: 'Concept Description', icon: 'mdi-text-box-outline' },
  'aas-descriptor': { componentKey: 'AASRegistry', root: '/shell-descriptors', label: 'AAS Descriptor', icon: 'mdi-card-account-details-outline' },
  'submodel-descriptor': { componentKey: 'SubmodelRegistry', root: '/submodel-descriptors', label: 'Submodel Descriptor', icon: 'mdi-card-text-outline' },
  'discovery': { componentKey: 'AASDiscovery', root: '/lookup/shells', label: 'Discovery Entry', icon: 'mdi-magnify' },
}

export const resourceAccessTargetOptions = Object.entries(resourceAccessTargets).map(([value, definition]) => ({
  title: definition.label,
  componentKey: definition.componentKey,
  value: value as ResourceAccessTargetKind,
}))

/**
 * Builds the target of an individual resource from its identifiers.
 * Identifiers are base64url encoded, idShort paths are URL encoded as in the
 * AAS API, so `list[0]` becomes `list%5B0%5D`.
 */
export function buildResourceAccessTarget (input: ResourceAccessTargetInput): ResourceAccessTarget {
  const definition = resourceAccessTargets[input.kind]
  if (!definition) {
    throw new Error('Sharing is only available for individual resources.')
  }
  const root = ensureEndpointRoot(input.baseUrl, definition.root)
  const endpoint = input.kind === 'submodel-element'
    ? `${root}/${encodeRequired(input.submodelId, 'Submodel ID')}/submodel-elements/${encodeIdShortPath(input.idShortPath)}`
    : `${root}/${encodeRequired(input.resourceId, 'resource ID')}`
  const identity = input.kind === 'submodel-element' ? input.idShortPath : input.resourceId
  return {
    kind: input.kind,
    label: identity ? `${definition.label}: ${identity}` : definition.label,
    endpoint,
    componentKey: definition.componentKey,
  }
}

const viewableObjectKinds: Partial<Record<string, ResourceAccessTargetKind>> = {
  aas: 'aas',
  submodel: 'submodel',
  element: 'submodel-element',
}

/**
 * Builds the target of a shell, Submodel or SubmodelElement returned by the
 * ReBAC API, so it can be opened in a viewer. Other objects return undefined.
 */
export function targetFromAccessObject (object: AccessObject, baseUrlOf: (component: BaSyxComponentKey) => string | undefined): ResourceAccessTarget | undefined {
  const kind = viewableObjectKinds[object.type]
  const baseUrl = kind ? baseUrlOf(resourceAccessTargets[kind].componentKey) : undefined
  if (!kind || !baseUrl) {
    return undefined
  }
  return buildResourceAccessTarget({ kind, baseUrl, resourceId: object.id, submodelId: object.id, idShortPath: object.idShortPath })
}

/**
 * Builds the target of a Submodel or SubmodelElement from its repository
 * endpoint as used by the tree views, for example
 * `…/submodels/{id}/submodel-elements/a.b%5B0%5D`.
 */
export function targetFromSubmodelEndpoint (endpoint: string, label: string): ResourceAccessTarget | undefined {
  const normalized = endpoint.trim().replace(/\/+$/, '')
  const match = /\/submodels\/[^/]+(\/submodel-elements\/[^/]+)?$/.exec(normalized)
  if (!match || normalized.includes('/shells/')) {
    return undefined
  }
  return {
    kind: match[1] ? 'submodel-element' : 'submodel',
    label,
    endpoint: normalized,
    componentKey: 'SubmodelRepo',
  }
}

export function accessEndpoint (target: ResourceAccessTarget): string {
  return `${target.endpoint.replace(/\/$/, '')}/$access`
}

export function resourceAccessIcon (target?: ResourceAccessTarget): string {
  return target ? resourceAccessTargets[target.kind].icon : 'mdi-account-lock-outline'
}

export function encodeIdShortPath (value: string | undefined): string {
  const path = value?.trim()
  if (!path) {
    throw new Error('idShort path is required.')
  }
  return encodeURIComponent(path)
}

function ensureEndpointRoot (baseUrl: string, root: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (!normalized) {
    throw new Error('The component endpoint is not configured.')
  }
  return normalized.endsWith(root) ? normalized : `${normalized}${root}`
}

function encodeRequired (value: string | undefined, name: string): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    throw new Error(`${name} is required.`)
  }
  return base64Encode(trimmed)
}
