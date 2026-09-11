import { describe, expect, it } from 'vitest'
import { sharingRole, sharingRoleLabel, sharingRoles } from '@/utils/SharingRoles'

describe('Sharing roles', () => {
  it('keeps editing separate from deleting, executing and creating', () => {
    expect(sharingRoles.find(role => role.value === 'edit')?.rights).toEqual(['READ', 'UPDATE'])
    expect(sharingRoles.find(role => role.value === 'view')?.rights).toEqual(['READ'])
    expect(sharingRoles.find(role => role.value === 'create')).toBeUndefined()
    expect(sharingRole(['CREATE'])).toBe('custom')
  })
  it('recognizes exact presets regardless of order without mislabelling custom grants', () => {
    expect(sharingRole(['UPDATE', 'READ'])).toBe('edit')
    expect(sharingRoleLabel(['READ'])).toBe('Can view')
    expect(sharingRole(['VIEW'])).toBe('custom')
    expect(sharingRole(['ALL'])).toBe('custom')
    expect(sharingRole(['READ', 'UPDATE', 'DELETE'])).toBe('custom')
    expect(sharingRole([])).toBe('custom')
  })
})
