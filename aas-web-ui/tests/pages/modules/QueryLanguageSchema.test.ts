import { describe, expect, it } from 'vitest'
import sourceSchema from '@/pages/modules/queryLanguage/query-language.schema.json'
import {
  createQueryLanguageSchema,
  queryLanguageSchema,
} from '@/pages/modules/queryLanguage/queryLanguageSchema'

describe('query language JSON Schema', () => {
  it('keeps the supplied schema definitions as the source of truth', () => {
    expect(queryLanguageSchema.definitions).toBe(sourceSchema.definitions)
    expect(queryLanguageSchema.oneOf).toEqual([
      { $ref: '#/definitions/Query' },
    ])
  })

  it('contains the query properties used for validation and completion', () => {
    const queryDefinition = sourceSchema.definitions.Query

    expect(queryDefinition.required).toContain('$condition')
    expect(queryDefinition.properties).toHaveProperty('$select')
    expect(queryDefinition.properties).toHaveProperty('$condition')
    expect(queryDefinition.properties).toHaveProperty('$filters')
    expect(queryDefinition.additionalProperties).toBe(false)
  })

  it('rejects a replacement schema without a Query definition', () => {
    expect(() => createQueryLanguageSchema({ definitions: {} }))
      .toThrow('The query language schema must define #/definitions/Query.')
  })
})
