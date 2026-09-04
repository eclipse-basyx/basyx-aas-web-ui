export const HEX_VAL_PATTERN = /^16#[0-9A-F]+$/

export const TIME_VAL_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/

export const DATE_TIME_VAL_PATTERN
  = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/

const INDEX = String.raw`\[(?:0|[1-9]\d*)?\]`

const SEMANTIC_ID
  = String.raw`semanticId(?:\.(?:keys${INDEX})?)?`

const SUPPLEMENTAL
  = String.raw`supplementalSemanticIds(?:${INDEX})?(?:\.(?:keys${INDEX})?)?`

const ENDPOINTS = `endpoints${INDEX}`

const SPECIFIC_ASSET
  = String.raw`specificAssetIds${INDEX}(?:\.externalSubjectId(?:\.keys${INDEX})?)?`

const SUBMODELS
  = String.raw`submodels${INDEX}(?:\.keys${INDEX})?`

const SUBMODEL_DESC
  = String.raw`submodelDescriptors${INDEX}(?:\.(?:${SEMANTIC_ID}|${SUPPLEMENTAL}|idShort|${ENDPOINTS}))?`

const AAS_FIELDS
  = String.raw`idShort|assetInformation\.assetType|assetInformation\.globalAssetId|assetInformation\.${SPECIFIC_ASSET}|${SUBMODELS}`

const SM_FIELDS
  = `${SEMANTIC_ID}|${SUPPLEMENTAL}|idShort|id`

const SME_FIELDS
  = `${SEMANTIC_ID}|${SUPPLEMENTAL}|idShort|value|valueType|language`

const AASDESC_FIELDS
  = `idShort|description|displayName|extension|administration|assetKind|assetType|globalAssetId|${SPECIFIC_ASSET}|${ENDPOINTS}|${SUBMODEL_DESC}`

const SMDESC_FIELDS
  = `${SEMANTIC_ID}|${SUPPLEMENTAL}|idShort|${ENDPOINTS}`

const ID_SHORT_SEGMENT = String.raw`[A-Za-z](?:[\w-]*\w)?`

const ID_SHORT = `${ID_SHORT_SEGMENT}(?:${INDEX})*`
const ID_SHORT_PATH = String.raw`${ID_SHORT}(?:\.${ID_SHORT})*`

export const FIELD_PATTERN = new RegExp(
  '^(?:'
  + String.raw`\$aas#(?:${AAS_FIELDS})|`
  + String.raw`\$sm#(?:${SM_FIELDS})|`
  + String.raw`\$sme(?:\.${ID_SHORT_PATH})?(?:#(?:${SME_FIELDS}))?|`
  + String.raw`\$cd#idShort|`
  + String.raw`\$aasdesc#(?:${AASDESC_FIELDS})|`
  + String.raw`\$smdesc#(?:${SMDESC_FIELDS})`
  + ')$',
)
