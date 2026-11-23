import { describe, expect, it } from 'vitest'
import { createEmptyEdcAssetOAuth2, hasEdcAssetOAuth2 } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'

describe('EdcAssetOAuth2', () => {
  it('reports whether any OAuth2 value is set', () => {
    expect(hasEdcAssetOAuth2(createEmptyEdcAssetOAuth2())).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: ' ' })).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: 'read' })).toBe(true)
  })
})
