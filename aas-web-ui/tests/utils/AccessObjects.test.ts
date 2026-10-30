import { describe, expect, it } from 'vitest'
import { auditResourceLabel } from '@/utils/AccessObjects'

describe('auditResourceLabel', () => {
  it('names resources, element paths and repositories', () => {
    expect(auditResourceLabel({ type: 'aas', id: 'urn:aas' })).toBe('Asset Administration Shell: urn:aas')
    expect(auditResourceLabel({ type: 'element', id: 'urn:sm', idShortPath: 'a[0]' })).toBe('Submodel Element: urn:sm · a[0]')
    expect(auditResourceLabel({ type: 'repository', id: 'submodel' })).toBe('Repository: Submodels')
  })
})
