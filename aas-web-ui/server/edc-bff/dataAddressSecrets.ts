import { createHttpError } from './edcRequests.js'

/**
 * Secrets in the data address of an asset, e.g. `authCode` or `header:x-api-key`, never reach the browser.
 * Query responses carry this placeholder instead. On an update the BFF puts the stored secret back.
 */
export const redactedSecretValue = '<redacted>'

type JsonObject = Record<string, unknown>

const edcNamespace = 'https://w3id.org/edc/v0.0.1/ns/'
const secretKeyPattern = /secret|password|passwd|token|authcode|authorization|apikey|api-key|api_key|credential|accesskey|privatekey/i
// Names of secrets in the EDC vault and URLs are no secrets themselves, e.g. `secretName` or `oauth2:tokenUrl`
const secretReferenceKeyPattern = /(?:secretname|secretkey|keyname|keyalias|url|uri)$/i

/** Replaces the secrets in the data addresses of the given assets with the placeholder. */
export function redactAssetSecrets (assets: unknown): unknown {
  if (Array.isArray(assets)) {
    return assets.map(asset => redactAssetSecrets(asset))
  }

  const dataAddressKey = findDataAddressKey(assets)
  if (!dataAddressKey) {
    return assets
  }

  const asset = assets as JsonObject
  const dataAddress = asset[dataAddressKey] as JsonObject
  return {
    ...asset,
    [dataAddressKey]: Object.fromEntries(Object.entries(dataAddress).map(([key, value]) =>
      [key, isSecretKey(key) && value !== null && value !== undefined && value !== '' ? redactedSecretValue : value])),
  }
}

/** Refuses a new asset with a placeholder: there is no stored secret to put back. */
export function assertNoSecretPlaceholders (asset: unknown): void {
  const placeholderKeys = getPlaceholderKeys(asset)
  if (placeholderKeys.length > 0) {
    throw createRedactedSecretError(
      `Replace "${redactedSecretValue}" in ${formatKeys(placeholderKeys)} with the secret value.`,
    )
  }
}

/**
 * Puts the stored secrets back in place of the placeholders of an updated asset.
 * Only while the data address is otherwise unchanged: a new target, e.g. another `baseUrl`, would receive the stored secret.
 */
export function restoreAssetSecrets (updatedAsset: JsonObject, storedAsset: unknown): JsonObject {
  const placeholderKeys = getPlaceholderKeys(updatedAsset)
  if (placeholderKeys.length === 0) {
    return updatedAsset
  }

  const updatedDataAddressKey = findDataAddressKey(updatedAsset)!
  const updatedDataAddress = updatedAsset[updatedDataAddressKey] as JsonObject
  const storedDataAddressKey = findDataAddressKey(storedAsset)
  if (!storedDataAddressKey) {
    throw createRedactedSecretError(
      `The stored asset could not be loaded to take its secrets. Replace "${redactedSecretValue}" in ${formatKeys(placeholderKeys)} with the secret value.`,
    )
  }
  const storedDataAddress = (storedAsset as JsonObject)[storedDataAddressKey] as JsonObject

  if (!hasSameNonSecretProperties(updatedDataAddress, storedDataAddress)) {
    throw createRedactedSecretError(
      `The data address changed, so the stored secrets are not reused. Replace "${redactedSecretValue}" in ${formatKeys(placeholderKeys)} with the secret value.`,
    )
  }

  const storedSecrets = new Map(Object.entries(storedDataAddress).map(([key, value]) => [localName(key), value]))
  const unresolvedKeys = placeholderKeys.filter(key => !isStoredSecret(storedSecrets.get(localName(key))))
  if (unresolvedKeys.length > 0) {
    throw createRedactedSecretError(
      `No stored secret for ${formatKeys(unresolvedKeys)}. Replace "${redactedSecretValue}" with the secret value.`,
    )
  }

  return {
    ...updatedAsset,
    [updatedDataAddressKey]: Object.fromEntries(Object.entries(updatedDataAddress).map(([key, value]) =>
      [key, value === redactedSecretValue ? storedSecrets.get(localName(key)) : value])),
  }
}

/** Whether the asset carries a placeholder in its data address, i.e. needs the stored asset to be updated. */
export function hasSecretPlaceholders (asset: unknown): boolean {
  return getPlaceholderKeys(asset).length > 0
}

export function isSecretKey (key: string): boolean {
  const name = localName(key)
  if (name.toLowerCase().startsWith('header:')) {
    return true // Additional HTTP headers, mostly credentials, e.g. `header:Authorization`
  }
  return secretKeyPattern.test(name) && !secretReferenceKeyPattern.test(name)
}

function getPlaceholderKeys (asset: unknown): string[] {
  const dataAddressKey = findDataAddressKey(asset)
  if (!dataAddressKey) {
    return []
  }

  return Object.entries((asset as JsonObject)[dataAddressKey] as JsonObject)
    .filter(([, value]) => value === redactedSecretValue)
    .map(([key]) => key)
}

function hasSameNonSecretProperties (dataAddressA: JsonObject, dataAddressB: JsonObject): boolean {
  const nonSecretProperties = (dataAddress: JsonObject): string[] => Object.entries(dataAddress)
    .filter(([key]) => !isSecretKey(key))
    .map(([key, value]) => `${localName(key)}=${JSON.stringify(value)}`)
    .toSorted()

  return JSON.stringify(nonSecretProperties(dataAddressA)) === JSON.stringify(nonSecretProperties(dataAddressB))
}

function isStoredSecret (value: unknown): boolean {
  return value !== undefined && value !== null && value !== '' && value !== redactedSecretValue
}

function findDataAddressKey (asset: unknown): string | undefined {
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
    return undefined
  }

  return Object.keys(asset).find(key => {
    const value = (asset as JsonObject)[key]
    return localName(key) === 'dataAddress' && !!value && typeof value === 'object' && !Array.isArray(value)
  })
}

// `authCode`, `edc:authCode` and the full IRI name the same property, depending on the JSON-LD context
function localName (key: string): string {
  if (key.startsWith(edcNamespace)) {
    return key.slice(edcNamespace.length)
  }
  return key.startsWith('edc:') ? key.slice('edc:'.length) : key
}

function formatKeys (keys: string[]): string {
  return keys.map(key => `dataAddress.${localName(key)}`).join(', ')
}

function createRedactedSecretError (details: string): Error {
  return Object.assign(
    createHttpError('Redacted EDC asset secret cannot be stored', 400, details),
    { code: 'EDC_REDACTED_SECRET' },
  )
}
