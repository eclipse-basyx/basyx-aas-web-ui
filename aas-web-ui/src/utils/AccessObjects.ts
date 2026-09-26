import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { AuditResource, RepositoryKind } from '@/types/ResourceAccess'

/** Repository families with the component that serves them. */
export const repositoryFamilies: Array<{ title: string, value: RepositoryKind, component: BaSyxComponentKey }> = [
  { title: 'Asset Administration Shells', value: 'aas', component: 'AASRepo' },
  { title: 'Submodels', value: 'submodel', component: 'SubmodelRepo' },
  { title: 'Concept Descriptions', value: 'concept_description', component: 'ConceptDescriptionRepo' },
  { title: 'AAS Descriptors', value: 'aas_descriptor', component: 'AASRegistry' },
  { title: 'Submodel Descriptors', value: 'submodel_descriptor', component: 'SubmodelRegistry' },
  { title: 'Discovery entries', value: 'asset_links', component: 'AASDiscovery' },
]

/** Object types of the audit trail as used by its filters. */
export const auditObjectTypes = [
  { title: 'Asset Administration Shell', value: 'aas' },
  { title: 'Submodel', value: 'submodel' },
  { title: 'Submodel Element', value: 'element' },
  { title: 'Concept Description', value: 'concept_description' },
  { title: 'AAS Descriptor', value: 'aas_descriptor' },
  { title: 'Submodel Descriptor', value: 'submodel_descriptor' },
  { title: 'Discovery entry', value: 'asset_links' },
  { title: 'AASX package', value: 'aasx_package' },
  { title: 'Repository', value: 'repository' },
]

/** A readable label of an audited object. */
export function auditResourceLabel (resource: AuditResource): string {
  const type = auditObjectTypes.find(option => option.value === resource.type)?.title ?? resource.type
  if (resource.type === 'repository') {
    return `${type}: ${repositoryFamilies.find(family => family.value === resource.id)?.title ?? resource.id}`
  }
  return resource.idShortPath ? `${type}: ${resource.id} · ${resource.idShortPath}` : `${type}: ${resource.id}`
}
