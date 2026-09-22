import type { CodeSchema } from '@/components/Code/codeSchema'
import source from './aas-3.1.schema.json'

export type AasEditorRoot = 'Submodel' | 'SubmodelElement'

export function getAasEditorNamespace (root: AasEditorRoot): string {
  return root === 'Submodel' ? 'aas-submodel' : 'aas-submodel-element'
}

export function createAasEditorSchema (root: AasEditorRoot): CodeSchema {
  const definition = root === 'Submodel' ? 'Submodel' : 'SubmodelElement_choice'
  const uri = `https://admin-shell.io/aas/3/1/editor/${root}`
  return {
    uri,
    fileMatch: [`inmemory://${getAasEditorNamespace(root)}/*.json`],
    schema: {
      ...source,
      $id: uri,
      title: `AAS 3.1 ${root}`,
      allOf: [{ $ref: `#/definitions/${definition}` }],
    },
  }
}
