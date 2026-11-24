import { describe, expect, it } from 'vitest'
import { templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
import { ASSET_TEMPLATE_LABELS, CONTRACT_TEMPLATE_LABELS } from '@/pages/modules/EclipseDataspaceConnector/data/templatePlaceholderLabels'
import AssetTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset.json'
import ContractTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_contract.json'

describe('templatePlaceholderLabels', () => {
  it.each([
    ['asset', AssetTemplate, ASSET_TEMPLATE_LABELS],
    ['contract', ContractTemplate, CONTRACT_TEMPLATE_LABELS],
  ])('names every placeholder of the %s template', (_name, template, labels) => {
    const templateLabels = templatePlaceholders(template).map(placeholder => placeholder.label)

    expect(Object.values(labels).toSorted()).toEqual(templateLabels.toSorted())
  })
})
