import { describe, expect, it } from 'vitest'
import {
  assertNoSecretPlaceholders,
  isSecretKey,
  redactAssetSecrets,
  redactedSecretValue,
  restoreAssetSecrets,
} from '../../../server/edc-bff/dataAddressSecrets'

const storedAsset = {
  '@id': 'asset-1',
  'properties': { name: 'DTR' },
  'dataAddress': {
    '@type': 'DataAddress',
    'type': 'HttpData',
    'baseUrl': 'https://dtr.internal/api/v3',
    'authKey': 'x-api-key',
    'authCode': 'STORED_API_KEY',
    'header:Authorization': 'Bearer STORED_TOKEN',
  },
}

describe('EDC BFF data address secrets', () => {
  it.each([
    'authCode',
    'edc:authCode',
    'https://w3id.org/edc/v0.0.1/ns/authCode',
    'header:x-api-key',
    'header:Authorization',
    'oauth2:clientSecret',
    'password',
    'secretAccessKey',
    'accessKeyId',
    'token',
  ])('treats %s as a secret', key => {
    expect(isSecretKey(key)).toBe(true)
  })

  it.each([
    'authKey',
    'baseUrl',
    'type',
    'secretName',
    'oauth2:clientSecretKey',
    'oauth2:privateKeyName',
    'oauth2:tokenUrl',
    'keyName',
    'proxyPath',
  ])('treats %s as no secret', key => {
    expect(isSecretKey(key)).toBe(false)
  })

  it('redacts the secrets in the data addresses of a query result', () => {
    const redacted = redactAssetSecrets([storedAsset, { '@id': 'asset-2' }]) as Array<typeof storedAsset>

    expect(redacted[0]!.dataAddress).toEqual({
      ...storedAsset.dataAddress,
      'authCode': redactedSecretValue,
      'header:Authorization': redactedSecretValue,
    })
    expect(redacted[0]!.properties).toEqual(storedAsset.properties)
    expect(redacted[1]).toEqual({ '@id': 'asset-2' })
    expect(JSON.stringify(redacted)).not.toContain('STORED_')
    expect(storedAsset.dataAddress.authCode).toBe('STORED_API_KEY') // Not changed in place
  })

  it('redacts prefixed data addresses', () => {
    const redacted = redactAssetSecrets({ 'edc:dataAddress': { 'edc:authCode': 'STORED_API_KEY' } })

    expect(redacted).toEqual({ 'edc:dataAddress': { 'edc:authCode': redactedSecretValue } })
  })

  it('puts the stored secrets back while the data address is otherwise unchanged', () => {
    const updatedAsset = {
      ...(redactAssetSecrets(storedAsset) as typeof storedAsset),
      properties: { name: 'Renamed DTR' },
    }

    expect(restoreAssetSecrets(updatedAsset, storedAsset)).toEqual({
      ...storedAsset,
      properties: { name: 'Renamed DTR' },
    })
  })

  it('keeps a secret that was entered anew', () => {
    const updatedAsset = redactAssetSecrets(storedAsset) as typeof storedAsset
    updatedAsset.dataAddress.authCode = 'NEW_API_KEY'

    expect(restoreAssetSecrets(updatedAsset, storedAsset).dataAddress).toMatchObject({
      'authCode': 'NEW_API_KEY',
      'header:Authorization': 'Bearer STORED_TOKEN',
    })
  })

  it('does not reuse the stored secrets for a changed data address', () => {
    const updatedAsset = redactAssetSecrets(storedAsset) as typeof storedAsset
    updatedAsset.dataAddress.baseUrl = 'https://attacker.test'

    expect(() => restoreAssetSecrets(updatedAsset, storedAsset)).toThrow(expect.objectContaining({
      status: 400,
      code: 'EDC_REDACTED_SECRET',
      details: expect.stringContaining('The data address changed'),
    }))
  })

  it('refuses a placeholder without a stored secret', () => {
    const updatedAsset = redactAssetSecrets(storedAsset) as typeof storedAsset
    const withoutStoredToken = {
      ...storedAsset,
      dataAddress: { ...storedAsset.dataAddress, 'header:Authorization': '' },
    }

    expect(() => restoreAssetSecrets(updatedAsset, withoutStoredToken)).toThrow(expect.objectContaining({
      details: expect.stringContaining('No stored secret for dataAddress.header:Authorization'),
    }))
    expect(() => restoreAssetSecrets(updatedAsset, undefined)).toThrow(expect.objectContaining({
      details: expect.stringContaining('The stored asset could not be loaded'),
    }))
  })

  it('refuses a new asset with a placeholder', () => {
    expect(() => assertNoSecretPlaceholders(redactAssetSecrets(storedAsset))).toThrow(expect.objectContaining({
      status: 400,
      details: expect.stringContaining('dataAddress.authCode, dataAddress.header:Authorization'),
    }))
    expect(() => assertNoSecretPlaceholders(storedAsset)).not.toThrow()
  })
})
