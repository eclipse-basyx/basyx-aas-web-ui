import { describe, expect, it } from 'vitest'
import {
  createEmptyEdcAssetOAuth2,
  edcAssetOAuth2PlaceholderValues,
  hasEdcAssetOAuth2,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'
import { templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'

describe('EdcAssetOAuth2', () => {
  it('reports whether any OAuth2 value is set', () => {
    expect(hasEdcAssetOAuth2(createEmptyEdcAssetOAuth2())).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: ' ' })).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: 'read' })).toBe(true)
  })

  it('gives the OAuth2 values by the labels of the oauth2 placeholders of a template', () => {
    const placeholders = templatePlaceholders({
      'baseUrl': '{{Asset Endpoint}}',
      'oauth2:clientId': '{{Endpoint client ID}}',
      'oauth2:scope': '{{Token scope}}',
    })

    expect(edcAssetOAuth2PlaceholderValues(placeholders, { ...createEmptyEdcAssetOAuth2(), clientId: ' client ', tokenUrl: 'https://token' }))
      .toEqual({ 'Endpoint client ID': 'client', 'Token scope': '' })
  })
})
