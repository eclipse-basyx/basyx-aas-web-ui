import type { AccessRight } from '@/types/ResourceAccess'

export const sharingRoles: Array<{ title: string, value: string, rights: AccessRight[], description: string }> = [
  { title: 'Can view', value: 'view', rights: ['READ'], description: 'Read this resource without changing it.' },
  { title: 'Can edit', value: 'edit', rights: ['READ', 'UPDATE'], description: 'Read and edit existing data. Does not include deleting or executing operations.' },
]

export const sharingRightLabels: Record<AccessRight, string> = {
  CREATE: 'Create items', READ: 'Read data', UPDATE: 'Edit data', DELETE: 'Delete data',
  EXECUTE: 'Execute operations', VIEW: 'View references', ALL: 'Full data access',
}

export function sharingRole (rights: AccessRight[]): string {
  const unique = new Set(rights)
  return sharingRoles.find(role => role.rights.length === unique.size && role.rights.every(right => unique.has(right)))?.value ?? 'custom'
}

export function sharingRoleLabel (rights: AccessRight[]): string {
  return sharingRoles.find(role => role.value === sharingRole(rights))?.title ?? 'Custom permissions'
}
