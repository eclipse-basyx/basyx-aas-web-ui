import { describe, expect, it } from 'vitest'
import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'

const template = {
  '@id': '{{Asset ID|e.g. a UUID|The @id of the asset}}',
  'properties': { id: '{{Asset ID}}', name: '{{Asset Name||}}', type: 'Asset' },
  'dataAddress': { baseUrl: '{{Base URL|https://…}}' },
  'rightOperand': ['{{BPN}}', 'BPNL000000000001'],
}

describe('EdcTemplatePlaceholders', () => {
  it('reads each label once with its attributes, placeholder and hint', () => {
    expect(templatePlaceholders(template)).toEqual([
      { attribute: '@id', attributes: ['@id', 'id'], label: 'Asset ID', placeholder: 'e.g. a UUID', hint: 'The @id of the asset' },
      { attribute: 'name', attributes: ['name'], label: 'Asset Name', placeholder: '', hint: '' },
      { attribute: 'baseUrl', attributes: ['baseUrl'], label: 'Base URL', placeholder: 'https://…', hint: '' },
      { attribute: 'rightOperand', attributes: ['rightOperand'], label: 'BPN', placeholder: '', hint: '' },
    ])
  })

  it('inserts values as they are, also with quotes, backslashes or $& and without adding properties', () => {
    const injection = 'x", "dataAddress": {"baseUrl": "https://evil.test"}, "y": "'
    const filled = fillTemplatePlaceholders(template, {
      'Asset ID': String.raw`dtr"test\$&`,
      'Asset Name': injection,
      'Base URL': 'https://backend.test',
      'BPN': 'BPNL000000000002',
    })

    expect(filled).toEqual({
      '@id': String.raw`dtr"test\$&`,
      'properties': { id: String.raw`dtr"test\$&`, name: injection, type: 'Asset' },
      'dataAddress': { baseUrl: 'https://backend.test' },
      'rightOperand': ['BPNL000000000002', 'BPNL000000000001'],
    })
  })

  it('removes unfilled placeholders, or keeps them as {{Label}} for a preview', () => {
    expect(fillTemplatePlaceholders(template, { 'Asset ID': 'a' })).toEqual({
      '@id': 'a',
      'properties': { id: 'a', type: 'Asset' },
      'dataAddress': {},
      'rightOperand': ['BPNL000000000001'],
    })
    expect(fillTemplatePlaceholders(template, { 'Asset ID': 'a' }, { keepUnfilled: true })).toMatchObject({
      properties: { name: '{{Asset Name}}' },
      dataAddress: { baseUrl: '{{Base URL}}' },
      rightOperand: ['{{BPN}}', 'BPNL000000000001'],
    })
  })
})
