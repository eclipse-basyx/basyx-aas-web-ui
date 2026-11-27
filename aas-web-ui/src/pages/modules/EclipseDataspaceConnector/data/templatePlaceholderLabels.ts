// Labels of the template placeholders that the code fills or reads, the keys of their values (see `EdcTemplatePlaceholders.ts`).
// They have to match the labels in the template files.

// Placeholders of `template_asset.json`, filled for an Asset created from an AAS or Submodel
export const ASSET_TEMPLATE_LABELS = {
  assetId: 'Asset ID',
  displayName: 'Asset Display Name',
  description: 'Asset Description',
  endpoint: 'Asset Endpoint',
  clientId: 'Endpoint client ID',
  clientSecretKey: 'Endpoint client secret key',
  tokenUrl: 'Token endpoint',
  scope: 'Token scope',
} as const

// Placeholders of `template_contract.json`, chosen from the Assets and Policies of the EDC
export const CONTRACT_TEMPLATE_LABELS = {
  assetId: 'Asset ID',
  accessPolicyId: 'Access Policy ID',
  usagePolicyId: 'Usage Policy ID',
  contractId: 'Contract ID',
} as const
