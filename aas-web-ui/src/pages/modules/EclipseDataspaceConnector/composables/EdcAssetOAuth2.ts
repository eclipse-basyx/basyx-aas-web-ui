import type { TemplatePlaceholder } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'

/**
 * OAuth2 values of the data address of an Asset, empty values are left out of the asset.
 */
export interface EdcAssetOAuth2 {
  clientId: string
  clientSecretKey: string // Key of the client secret in the EDC vault, not the secret itself
  tokenUrl: string
  scope: string
}

export function createEmptyEdcAssetOAuth2 (): EdcAssetOAuth2 {
  return { clientId: '', clientSecretKey: '', tokenUrl: '', scope: '' }
}

export function hasEdcAssetOAuth2 (oauth2: EdcAssetOAuth2): boolean {
  return Object.values(oauth2).some(value => value.trim() !== '')
}

/**
 * Values of the "oauth2:*" placeholders of an asset template by label, e.g. "oauth2:clientId" → "Endpoint client ID".
 */
export function edcAssetOAuth2PlaceholderValues (placeholders: TemplatePlaceholder[], oauth2: EdcAssetOAuth2): Record<string, string> {
  return Object.fromEntries(placeholders
    .filter(placeholder => placeholder.attribute.startsWith('oauth2:'))
    .map(placeholder => [
      placeholder.label,
      oauth2[placeholder.attribute.replace('oauth2:', '') as keyof EdcAssetOAuth2]?.trim() ?? '',
    ]))
}
