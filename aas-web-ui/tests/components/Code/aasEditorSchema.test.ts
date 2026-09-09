/* eslint-disable antfu/no-import-node-modules-by-path -- Test Monaco's bundled service without a second language-service dependency. */
import { describe, expect, it } from 'vitest'
import { mergeCodeSchemas } from '@/components/Code/codeSchema'
import { mergeQueryLanguageSchemaRegistration } from '@/pages/modules/queryLanguage/queryLanguageDiagnostics'
import source from '@/schemas/aas/aas-3.1.schema.json'
import { type AasEditorRoot, createAasEditorSchema, getAasEditorNamespace } from '@/schemas/aas/aasEditorSchema'
// Monaco ships its JSON language service without declarations for these internal test entry points.
// @ts-expect-error The bundled implementation is exercised without adding another runtime dependency.
import { getLanguageService } from '../../../node_modules/monaco-editor/esm/external/vscode-json-languageservice/lib/esm/jsonLanguageService.js'
// @ts-expect-error The bundled implementation is exercised without adding another runtime dependency.
import { TextDocument } from '../../../node_modules/monaco-editor/esm/external/vscode-json-languageservice/lib/esm/jsonLanguageTypes.js'

function languageService () {
  const service = getLanguageService({})
  service.configure({ validate: true, schemas: mergeCodeSchemas(mergeQueryLanguageSchemaRegistration(), [
    createAasEditorSchema('Submodel'), createAasEditorSchema('SubmodelElement'),
  ]) })
  return service
}

describe('AAS schema assistance', () => {
  it('derives concrete roots without modifying the vendored Environment schema', () => {
    for (const root of ['Submodel', 'SubmodelElement'] as const) {
      const binding = createAasEditorSchema(root)
      expect(binding.fileMatch).toEqual([`inmemory://${getAasEditorNamespace(root)}/*.json`])
      expect(binding.schema).toMatchObject({ definitions: source.definitions, allOf: [{
        $ref: `#/definitions/${root === 'Submodel' ? 'Submodel' : 'SubmodelElement_choice'}`,
      }] })
    }
    expect(source.allOf).toEqual([{ $ref: '#/definitions/Environment' }])
  })

  it('merges schemas idempotently and preserves unrelated bindings', () => {
    const unrelated = { uri: 'urn:other', fileMatch: ['other.json'], schema: {} }
    const binding = createAasEditorSchema('Submodel')
    const first = mergeCodeSchemas([unrelated], [binding])
    expect(mergeCodeSchemas(first, [binding])).toEqual(first)
    expect(first[0]).toBe(unrelated)
  })

  it.each([
    ['Submodel', { modelType: 'Submodel', id: 'urn:test' }, true],
    ['Submodel', { modelType: 'Submodel' }, false],
    ['SubmodelElement', { modelType: 'Property', valueType: 'xs:double', value: '21' }, true],
    ['SubmodelElement', { modelType: 'Property' }, false],
    ['SubmodelElement', [{ modelType: 'Property', valueType: 'xs:string' }], false],
    ['SubmodelElement', { value: { modelType: 'Property', valueType: 'xs:string' } }, false],
  ] as const)('validates %s insertion %j', async (root, value, valid) => {
    const service = languageService()
    const document = TextDocument.create(`inmemory://${getAasEditorNamespace(root as AasEditorRoot)}/test.json`, 'json', 1, JSON.stringify(value))
    const diagnostics = await service.doValidation(document, service.parseJSONDocument(document))
    expect(diagnostics.length === 0).toBe(valid)
  })

  it('provides property and value suggestions for the concrete AAS type', async () => {
    const service = languageService()
    const uri = 'inmemory://aas-submodel-element/test.json'
    const document = TextDocument.create(uri, 'json', 1, '{"modelType":"Property", ""}')
    const result = await service.doComplete(document, { line: 0, character: 25 }, service.parseJSONDocument(document))
    expect(result.items.map((item: { label: string }) => item.label)).toContain('valueType')
    const valueDocument = TextDocument.create(uri, 'json', 2, '{"modelType":"Property", "valueType": ""}')
    const values = await service.doComplete(valueDocument, { line: 0, character: 38 }, service.parseJSONDocument(valueDocument))
    expect(values.items.map((item: { label: string }) => item.label)).toContain('"xs:string"')
  })

  it('does not apply query or AAS schemas to generic viewer documents', async () => {
    const service = languageService()
    const document = TextDocument.create('inmemory://code-viewer/test.json', 'json', 1, '{"arbitrary":true}')
    expect(await service.doValidation(document, service.parseJSONDocument(document))).toEqual([])
    const query = TextDocument.create('inmemory://aas-query-language/test.json', 'json', 1, '{"arbitrary":true}')
    expect((await service.doValidation(query, service.parseJSONDocument(query))).length).toBeGreaterThan(0)
  })
})
