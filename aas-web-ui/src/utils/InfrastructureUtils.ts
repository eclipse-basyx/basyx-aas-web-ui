import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { CatenaXAccessMode, InfrastructureConfig, InfrastructureTemplate } from '@/types/Infrastructure'

export type InfrastructureEndpointFieldKey
  = BaSyxComponentKey | 'AASEnvironment' | 'DigitalTwinRegistry' | 'SubmodelService'

export interface InfrastructureEndpointField {
  key: InfrastructureEndpointFieldKey
  label: string
  yamlKey: string
  componentKeys: BaSyxComponentKey[]
}

export interface InfrastructureTemplateDefinition {
  value: InfrastructureTemplate
  label: string
  description: string
  endpointFields: InfrastructureEndpointField[]
  usesSubmodelSuperpath: boolean
}

export type InfrastructureAasUploadMode = 'client' | 'server'
type InfrastructureTemplateInput = InfrastructureTemplate | Pick<InfrastructureConfig, 'template'> | null | undefined
type InfrastructureConfigInput = InfrastructureTemplate | Pick<InfrastructureConfig, 'template' | 'catenaX' | 'components'> | null | undefined

export const DEFAULT_INFRASTRUCTURE_TEMPLATE: InfrastructureTemplate = 'full'

/**
 * Get human-readable label for a BaSyx component key
 */
export function getComponentLabel (key: BaSyxComponentKey): string {
  const labels: Record<BaSyxComponentKey, string> = {
    AASDiscovery: 'AAS Discovery',
    AASRegistry: 'AAS Registry',
    SubmodelRegistry: 'Submodel Registry',
    AASRepo: 'AAS Repository',
    SubmodelRepo: 'Submodel Repository',
    ConceptDescriptionRepo: 'Concept Description Repository',
    CompanyLookup: 'Company Lookup',
  }
  return labels[key]
}

/**
 * List of all BaSyx component keys in display order
 */
export const BASYX_COMPONENT_KEYS: BaSyxComponentKey[] = [
  'AASDiscovery',
  'AASRegistry',
  'SubmodelRegistry',
  'AASRepo',
  'SubmodelRepo',
  'ConceptDescriptionRepo',
  'CompanyLookup',
]

const singleComponentEndpointFields: Record<BaSyxComponentKey, InfrastructureEndpointField> = {
  AASDiscovery: {
    key: 'AASDiscovery',
    label: 'AAS Discovery',
    yamlKey: 'aasDiscovery',
    componentKeys: ['AASDiscovery'],
  },
  AASRegistry: {
    key: 'AASRegistry',
    label: 'AAS Registry',
    yamlKey: 'aasRegistry',
    componentKeys: ['AASRegistry'],
  },
  SubmodelRegistry: {
    key: 'SubmodelRegistry',
    label: 'Submodel Registry',
    yamlKey: 'submodelRegistry',
    componentKeys: ['SubmodelRegistry'],
  },
  AASRepo: {
    key: 'AASRepo',
    label: 'AAS Repository',
    yamlKey: 'aasRepository',
    componentKeys: ['AASRepo'],
  },
  SubmodelRepo: {
    key: 'SubmodelRepo',
    label: 'Submodel Repository',
    yamlKey: 'submodelRepository',
    componentKeys: ['SubmodelRepo'],
  },
  ConceptDescriptionRepo: {
    key: 'ConceptDescriptionRepo',
    label: 'Concept Description Repository',
    yamlKey: 'conceptDescriptionRepository',
    componentKeys: ['ConceptDescriptionRepo'],

  },
  CompanyLookup: {
    key: 'CompanyLookup',
    label: 'Company Lookup',
    yamlKey: 'companyLookup',
    componentKeys: ['CompanyLookup'],
  },
}

export const INFRASTRUCTURE_TEMPLATE_DEFINITIONS: Record<
  InfrastructureTemplate,
  InfrastructureTemplateDefinition
> = {
  'full': {
    value: 'full',
    label: 'Full',
    description: 'Separate discovery, registries, repositories, and concept description repository.',
    endpointFields: BASYX_COMPONENT_KEYS.map(key => singleComponentEndpointFields[key]),
    usesSubmodelSuperpath: false,
  },
  'identifiable': {
    value: 'identifiable',
    label: 'Identifiable',
    description: 'AAS Repository only; submodels are accessed through shell superpaths.',
    endpointFields: [singleComponentEndpointFields.AASRepo],
    usesSubmodelSuperpath: true,
  },
  'mono-repo': {
    value: 'mono-repo',
    label: 'Mono Repo',
    description: 'Separate discovery and registries with one AAS Environment for all repositories.',
    endpointFields: [
      singleComponentEndpointFields.AASDiscovery,
      singleComponentEndpointFields.AASRegistry,
      singleComponentEndpointFields.SubmodelRegistry,
      {
        key: 'AASEnvironment',
        label: 'AAS Environment',
        yamlKey: 'aasEnvironment',
        componentKeys: ['AASRepo', 'SubmodelRepo', 'ConceptDescriptionRepo'],
      },
    ],
    usesSubmodelSuperpath: false,
  },
  'mono-all': {
    value: 'mono-all',
    label: 'Mono All',
    description: 'One AAS Environment exposes all full-template component APIs.',
    endpointFields: [
      {
        key: 'AASEnvironment',
        label: 'AAS Environment',
        yamlKey: 'aasEnvironment',
        componentKeys: BASYX_COMPONENT_KEYS,
      },
    ],
    usesSubmodelSuperpath: false,
  },
  'catena-x': {
    value: 'catena-x',
    label: 'Catena-X',
    description: 'Digital Twin Registry plus Submodel Service.',
    endpointFields: [
      {
        key: 'DigitalTwinRegistry',
        label: 'Digital Twin Registry',
        yamlKey: 'digitalTwinRegistry',
        componentKeys: ['AASDiscovery', 'AASRegistry'],
      },
      {
        key: 'SubmodelService',
        label: 'Submodel Service',
        yamlKey: 'submodelService',
        componentKeys: ['SubmodelRepo'],
      },
    ],
    usesSubmodelSuperpath: false,
  },
}

export const INFRASTRUCTURE_TEMPLATE_OPTIONS = Object.values(INFRASTRUCTURE_TEMPLATE_DEFINITIONS)

export function isInfrastructureTemplate (value: unknown): value is InfrastructureTemplate {
  return typeof value === 'string' && Object.hasOwn(INFRASTRUCTURE_TEMPLATE_DEFINITIONS, value)
}

export function normalizeInfrastructureTemplate (value: unknown): InfrastructureTemplate {
  return isInfrastructureTemplate(value) ? value : DEFAULT_INFRASTRUCTURE_TEMPLATE
}

export function getInfrastructureTemplate (
  templateOrInfra?: InfrastructureTemplate | string | Pick<InfrastructureConfig, 'template'> | null,
): InfrastructureTemplate {
  return typeof templateOrInfra === 'string'
    ? normalizeInfrastructureTemplate(templateOrInfra)
    : normalizeInfrastructureTemplate(templateOrInfra?.template)
}

export function isCatenaXAccessMode (value: unknown): value is CatenaXAccessMode {
  return value === 'direct' || value === 'edc'
}

export function getCatenaXAccessMode (
  infrastructure?: Pick<InfrastructureConfig, 'template' | 'catenaX' | 'components'> | null,
): CatenaXAccessMode {
  if (!infrastructure || getInfrastructureTemplate(infrastructure) !== 'catena-x') {
    return 'direct'
  }

  if (isCatenaXAccessMode(infrastructure.catenaX?.accessMode)) {
    return infrastructure.catenaX.accessMode
  }

  if (infrastructure.catenaX?.edc?.proxyId?.trim()) {
    return 'edc'
  }

  return 'direct'
}

export function getInfrastructureTemplateDefinition (
  templateOrInfra?: InfrastructureTemplate | Pick<InfrastructureConfig, 'template'> | null,
): InfrastructureTemplateDefinition {
  const template = typeof templateOrInfra === 'string'
    ? normalizeInfrastructureTemplate(templateOrInfra)
    : getInfrastructureTemplate(templateOrInfra)
  return INFRASTRUCTURE_TEMPLATE_DEFINITIONS[template]
}

export function getEndpointFieldsForTemplate (
  templateOrInfra?: InfrastructureConfigInput,
): InfrastructureEndpointField[] {
  if (
    typeof templateOrInfra === 'object'
    && getInfrastructureTemplate(templateOrInfra) === 'catena-x'
    && getCatenaXAccessMode(templateOrInfra) === 'edc'
  ) {
    return []
  }

  return getInfrastructureTemplateDefinition(templateOrInfra).endpointFields
}

export function getActiveComponentKeys (
  templateOrInfra?: InfrastructureConfigInput,
): BaSyxComponentKey[] {
  return Array.from(
    new Set(getEndpointFieldsForTemplate(templateOrInfra).flatMap(field => field.componentKeys)),
  )
}

export function isComponentActiveForTemplate (
  templateOrInfra: InfrastructureConfigInput,
  componentKey: BaSyxComponentKey,
): boolean {
  return getActiveComponentKeys(templateOrInfra).includes(componentKey)
}

export function getActiveComponentUrlForTemplate (
  infrastructure: Pick<InfrastructureConfig, 'components' | 'template' | 'catenaX'> | null | undefined,
  componentKey: BaSyxComponentKey,
): string {
  if (!infrastructure || !isComponentActiveForTemplate(infrastructure, componentKey)) {
    return ''
  }

  return infrastructure.components[componentKey]?.url?.trim() ?? ''
}

export function getEndpointFieldByKey (
  templateOrInfra: InfrastructureConfigInput,
  fieldKey: InfrastructureEndpointFieldKey,
): InfrastructureEndpointField | undefined {
  return getEndpointFieldsForTemplate(templateOrInfra).find(field => field.key === fieldKey)
}

export function getEndpointFieldValue (
  components: InfrastructureConfig['components'],
  field: InfrastructureEndpointField,
): string {
  for (const componentKey of field.componentKeys) {
    const url = components[componentKey]?.url?.trim() ?? ''
    if (url !== '') {
      return url
    }
  }
  return components[field.componentKeys[0]]?.url?.trim() ?? ''
}

export function setEndpointFieldValue (
  components: InfrastructureConfig['components'],
  field: InfrastructureEndpointField,
  url: string,
): void {
  for (const componentKey of field.componentKeys) {
    components[componentKey].url = url
  }
}

export function usesSubmodelSuperpath (
  templateOrInfra?: InfrastructureTemplateInput,
): boolean {
  return getInfrastructureTemplateDefinition(templateOrInfra).usesSubmodelSuperpath
}

export function supportsInfrastructureTemplate (
  supportedTemplates: unknown,
  templateOrInfra?: InfrastructureTemplate | string | Pick<InfrastructureConfig, 'template'> | null,
): boolean {
  if (!Array.isArray(supportedTemplates) || supportedTemplates.length === 0) {
    return true
  }

  const validSupportedTemplates = supportedTemplates.filter(isInfrastructureTemplate)
  if (validSupportedTemplates.length === 0) {
    return true
  }

  return validSupportedTemplates.includes(getInfrastructureTemplate(templateOrInfra))
}

export function getDefaultAasUploadMode (
  templateOrInfra?: InfrastructureTemplate | Pick<InfrastructureConfig, 'template'> | null,
): InfrastructureAasUploadMode {
  const template = getInfrastructureTemplate(templateOrInfra)
  return template === 'mono-repo' || template === 'mono-all' ? 'server' : 'client'
}

/**
 * Get summary text for infrastructure configuration.
 */
export function getInfrastructureSummary (infra: InfrastructureConfig): string {
  const endpointFields = getEndpointFieldsForTemplate(infra)
  const configuredCount = endpointFields.filter(
    field => getEndpointFieldValue(infra.components, field).trim() !== '',
  ).length
  return `${configuredCount} of ${endpointFields.length} endpoints configured`
}

/**
 * Form validation rule for required fields
 */
export function requiredRule (value: string): string | boolean {
  return !!value || 'This field is required'
}
