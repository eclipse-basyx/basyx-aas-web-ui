import { createHttpError } from './edcRequests.js'

/**
 * Secrets in the data address of an asset, e.g. `authCode` or `header:x-api-key`, and in its private properties,
 * also nested ones, never reach the browser. Query responses carry this placeholder instead.
 * On an update the BFF puts the stored secret back.
 */
export const redactedSecretValue = '<redacted>'

type JsonObject = Record<string, unknown>

const edcNamespace = 'https://w3id.org/edc/v0.0.1/ns/'
const secretKeyPattern = /secret|password|passwd|token|authcode|authorization|apikey|api-key|api_key|credential|accesskey|privatekey/i
// Names of secrets in the EDC vault and URLs are no secrets themselves, e.g. `secretName` or `oauth2:tokenUrl`
const secretReferenceKeyPattern = /(?:secretname|secretkey|keyname|keyalias|url|uri)$/i

/** Replaces the secrets in the data addresses and private properties of the given assets with the placeholder. */
export function redactAssetSecrets (assets: unknown): unknown {
  if (Array.isArray(assets)) {
    return assets.map(asset => redactAssetSecrets(asset))
  }

  const dataAddressKey = findObjectKey(assets, 'dataAddress')
  const privatePropertiesKey = findObjectKey(assets, 'privateProperties')
  if (!dataAddressKey && !privatePropertiesKey) {
    return assets
  }

  const asset = { ...(assets as JsonObject) }
  if (dataAddressKey) {
    asset[dataAddressKey] = Object.fromEntries(Object.entries(asset[dataAddressKey] as JsonObject).map(([key, value]) =>
      [key, isSecretKey(key) && hasValue(value) ? redactedSecretValue : value]))
  }
  if (privatePropertiesKey) {
    asset[privatePropertiesKey] = redactNestedSecrets(asset[privatePropertiesKey])
  }
  return asset
}

// Private properties are free-form JSON, so their secrets may be nested in objects and arrays
function redactNestedSecrets (value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => redactNestedSecrets(item))
  }
  if (!isJsonObject(value)) {
    return value
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, isSecretKey(key) && hasValue(item) ? redactedSecretValue : redactNestedSecrets(item)]))
}

/** Refuses a new asset with a placeholder: there is no stored secret to put back. */
export function assertNoSecretPlaceholders (asset: unknown): void {
  const placeholderPaths = getPlaceholderPaths(asset)
  if (placeholderPaths.length > 0) {
    throw createRedactedSecretError(
      `Replace "${redactedSecretValue}" in ${placeholderPaths.join(', ')} with the secret value.`,
    )
  }
}

/**
 * Puts the stored secrets back in place of the placeholders of an updated asset.
 * In the data address only while it is otherwise unchanged: a new target, e.g. another `baseUrl`, would receive the stored secret.
 * In the private properties at the same path, as the EDC sends them nowhere.
 */
export function restoreAssetSecrets (updatedAsset: JsonObject, storedAsset: unknown): JsonObject {
  const placeholderPaths = getPlaceholderPaths(updatedAsset)
  if (placeholderPaths.length === 0) {
    return updatedAsset
  }
  if (!isJsonObject(storedAsset)) {
    throw createRedactedSecretError(
      `The stored asset could not be loaded to take its secrets. Replace "${redactedSecretValue}" in ${placeholderPaths.join(', ')} with the secret value.`,
    )
  }

  return restorePrivatePropertySecrets(restoreDataAddressSecrets(updatedAsset, storedAsset), storedAsset)
}

function restoreDataAddressSecrets (updatedAsset: JsonObject, storedAsset: JsonObject): JsonObject {
  const placeholderKeys = getDataAddressPlaceholderKeys(updatedAsset)
  if (placeholderKeys.length === 0) {
    return updatedAsset
  }

  const updatedDataAddressKey = findObjectKey(updatedAsset, 'dataAddress')!
  const updatedDataAddress = updatedAsset[updatedDataAddressKey] as JsonObject
  const storedDataAddressKey = findObjectKey(storedAsset, 'dataAddress')
  const storedDataAddress = storedDataAddressKey ? storedAsset[storedDataAddressKey] as JsonObject : {}

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

function restorePrivatePropertySecrets (updatedAsset: JsonObject, storedAsset: JsonObject): JsonObject {
  const privatePropertiesKey = findObjectKey(updatedAsset, 'privateProperties')
  if (!privatePropertiesKey) {
    return updatedAsset
  }

  const storedPrivatePropertiesKey = findObjectKey(storedAsset, 'privateProperties')
  const unresolvedPaths: string[] = []
  const privateProperties = restoreNestedSecrets(
    updatedAsset[privatePropertiesKey],
    storedPrivatePropertiesKey ? storedAsset[storedPrivatePropertiesKey] : undefined,
    'privateProperties',
    unresolvedPaths,
  )
  if (unresolvedPaths.length > 0) {
    throw createRedactedSecretError(
      `No stored secret for ${unresolvedPaths.join(', ')}. Replace "${redactedSecretValue}" with the secret value.`,
    )
  }
  return { ...updatedAsset, [privatePropertiesKey]: privateProperties }
}

// Takes the stored value at the same path, by the local names of the keys
function restoreNestedSecrets (updated: unknown, stored: unknown, path: string, unresolvedPaths: string[]): unknown {
  if (updated === redactedSecretValue) {
    if (!isStoredSecret(stored)) {
      unresolvedPaths.push(path)
    }
    return stored
  }
  if (Array.isArray(updated)) {
    return updated.map((item, index) =>
      restoreNestedSecrets(item, Array.isArray(stored) ? stored[index] : undefined, `${path}[${index}]`, unresolvedPaths))
  }
  if (!isJsonObject(updated)) {
    return updated
  }
  const storedByName = new Map(isJsonObject(stored) ? Object.entries(stored).map(([key, value]) => [localName(key), value]) : [])
  return Object.fromEntries(Object.entries(updated).map(([key, value]) =>
    [key, restoreNestedSecrets(value, storedByName.get(localName(key)), `${path}.${localName(key)}`, unresolvedPaths)]))
}

/** Whether the asset carries a placeholder, i.e. needs the stored asset to be updated. */
export function hasSecretPlaceholders (asset: unknown): boolean {
  return getPlaceholderPaths(asset).length > 0
}

export function isSecretKey (key: string): boolean {
  const name = localName(key)
  if (name.toLowerCase().startsWith('header:')) {
    return true // Additional HTTP headers, mostly credentials, e.g. `header:Authorization`
  }
  return secretKeyPattern.test(name) && !secretReferenceKeyPattern.test(name)
}

// Paths of all placeholders for messages, e.g. `dataAddress.authCode` or `privateProperties.backend.apiKey`
function getPlaceholderPaths (asset: unknown): string[] {
  const privatePropertiesKey = findObjectKey(asset, 'privateProperties')
  return [
    ...getDataAddressPlaceholderKeys(asset).map(key => `dataAddress.${localName(key)}`),
    ...(privatePropertiesKey ? getNestedPlaceholderPaths((asset as JsonObject)[privatePropertiesKey], 'privateProperties') : []),
  ]
}

function getDataAddressPlaceholderKeys (asset: unknown): string[] {
  const dataAddressKey = findObjectKey(asset, 'dataAddress')
  if (!dataAddressKey) {
    return []
  }

  return Object.entries((asset as JsonObject)[dataAddressKey] as JsonObject)
    .filter(([, value]) => value === redactedSecretValue)
    .map(([key]) => key)
}

function getNestedPlaceholderPaths (value: unknown, path: string): string[] {
  if (value === redactedSecretValue) {
    return [path]
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => getNestedPlaceholderPaths(item, `${path}[${index}]`))
  }
  if (!isJsonObject(value)) {
    return []
  }
  return Object.entries(value).flatMap(([key, item]) => getNestedPlaceholderPaths(item, `${path}.${localName(key)}`))
}

function hasSameNonSecretProperties (dataAddressA: JsonObject, dataAddressB: JsonObject): boolean {
  const nonSecretProperties = (dataAddress: JsonObject): string[] => Object.entries(dataAddress)
    .filter(([key]) => !isSecretKey(key))
    .map(([key, value]) => `${localName(key)}=${JSON.stringify(value)}`)
    .toSorted()

  return JSON.stringify(nonSecretProperties(dataAddressA)) === JSON.stringify(nonSecretProperties(dataAddressB))
}

function isStoredSecret (value: unknown): boolean {
  return hasValue(value) && value !== redactedSecretValue
}

function hasValue (value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
}

function isJsonObject (value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

// The key of an object property of the asset, e.g. `dataAddress` or `edc:dataAddress`
function findObjectKey (asset: unknown, name: 'dataAddress' | 'privateProperties'): string | undefined {
  if (!isJsonObject(asset)) {
    return undefined
  }

  return Object.keys(asset).find(key => localName(key) === name && isJsonObject(asset[key]))
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
