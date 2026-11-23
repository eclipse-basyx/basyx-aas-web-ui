import type { CatenaXEdcContractDefinition } from '@/composables/Client/CatenaXEdcClient'
import { EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

const idOperands = new Set([`${EDC_NAMESPACE}id`, 'edc:id', 'id'])

/**
 * Returns whether the assets selector of the contract names one of the given assets by ID.
 * Resolves `=` and `in` criteria, also among several criteria; an empty selector names no asset.
 */
export function namesAnyAsset (contract: CatenaXEdcContractDefinition, assetIds: Set<string | undefined>): boolean {
  return selectorCriteria(contract)
    .filter(criterion => idOperands.has(String(criterion.operandLeft)))
    .filter(criterion => ['=', 'in'].includes(String(criterion.operator)))
    .flatMap(criterion => [criterion.operandRight].flat())
    .some(assetId => assetIds.has(String(assetId)))
}

/**
 * Returns whether the assets selector of the contract selects one of the given assets.
 * Like `namesAnyAsset`, but an empty selector selects all assets.
 */
export function selectsAnyAsset (contract: CatenaXEdcContractDefinition, assetIds: Set<string | undefined>): boolean {
  return selectorCriteria(contract).length === 0 ? assetIds.size > 0 : namesAnyAsset(contract, assetIds)
}

// The EDC returns a single criterion as object, several as array
function selectorCriteria (contract: CatenaXEdcContractDefinition): Array<Record<string, unknown>> {
  return [contract.assetsSelector ?? contract['edc:assetsSelector'] ?? []].flat() as Array<Record<string, unknown>>
}
