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
