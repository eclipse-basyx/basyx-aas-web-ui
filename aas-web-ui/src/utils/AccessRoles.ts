import type { AccessRelation, GrantRelation, RepositoryRelation, ResourceAccessTargetKind } from '@/types/ResourceAccess'

export interface AccessRoleOption<T extends GrantRelation = GrantRelation> {
  value: T
  title: string
  description: string
  icon: string
}

export const accessRoles: Array<AccessRoleOption<AccessRelation>> = [
  { value: 'viewer', title: 'Viewer', description: 'Can view the resource.', icon: 'mdi-eye-outline' },
  { value: 'editor', title: 'Editor', description: 'Can view and edit the resource and add elements.', icon: 'mdi-pencil-outline' },
  { value: 'executor', title: 'Executor', description: 'Can run operations and read their results.', icon: 'mdi-play-circle-outline' },
  { value: 'owner', title: 'Owner', description: 'Full access, including deleting the resource and managing access.', icon: 'mdi-shield-crown-outline' },
]

export const repositoryRoles: Array<AccessRoleOption<RepositoryRelation>> = [
  { value: 'creator', title: 'Creator', description: 'Can create new resources and becomes their owner.', icon: 'mdi-plus-circle-outline' },
  { value: 'admin', title: 'Administrator', description: 'Full access to every resource of this kind and to its repository access.', icon: 'mdi-shield-account-outline' },
]

const operationKinds: Set<ResourceAccessTargetKind> = new Set(['aas', 'submodel', 'submodel-element'])

/** Returns the roles that can be granted on a kind of resource. */
export function rolesFor (kind: ResourceAccessTargetKind): Array<AccessRoleOption<AccessRelation>> {
  return accessRoles.filter(role => role.value !== 'executor' || operationKinds.has(kind))
}

export function roleOption (relation: GrantRelation): AccessRoleOption {
  return [...accessRoles, ...repositoryRoles].find(role => role.value === relation)
    ?? { value: relation, title: relation, description: '', icon: 'mdi-account-key-outline' }
}
