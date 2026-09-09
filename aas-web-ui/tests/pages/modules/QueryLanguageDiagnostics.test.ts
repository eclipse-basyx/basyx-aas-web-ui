import { describe, expect, it } from 'vitest'
import {
  hasQueryLanguageSchemaRegistration,
  mergeQueryLanguageSchemaRegistration,
  QUERY_LANGUAGE_MODEL_PATTERN,
} from '@/pages/modules/queryLanguage/queryLanguageDiagnostics'
import {
  QUERY_LANGUAGE_SCHEMA_URI,
  queryLanguageSchema,
} from '@/pages/modules/queryLanguage/queryLanguageSchema'

describe('query language Monaco schema registration', () => {
  it('uses one shared pattern for every query editor model', () => {
    const schemas = mergeQueryLanguageSchemaRegistration()

    expect(schemas).toEqual([
      {
        fileMatch: [QUERY_LANGUAGE_MODEL_PATTERN],
        schema: queryLanguageSchema,
        uri: QUERY_LANGUAGE_SCHEMA_URI,
      },
    ])
    expect(QUERY_LANGUAGE_MODEL_PATTERN).toBe('inmemory://aas-query-language/*.json')
  })

  it('preserves unrelated schemas and replaces stale query registrations', () => {
    const unrelatedSchema = {
      fileMatch: ['unrelated-*.json'],
      schema: { type: 'object' },
      uri: 'https://example.com/unrelated.schema.json',
    }
    const staleQueryRegistration = {
      fileMatch: ['inmemory://aas-query-language/query-a.json'],
      schema: queryLanguageSchema,
      uri: QUERY_LANGUAGE_SCHEMA_URI,
    }

    const schemas = mergeQueryLanguageSchemaRegistration([
      unrelatedSchema,
      staleQueryRegistration,
    ])

    expect(schemas).toHaveLength(2)
    expect(schemas[0]).toBe(unrelatedSchema)
    expect(hasQueryLanguageSchemaRegistration(schemas)).toBe(true)
    expect(schemas.filter(schema => schema.uri === QUERY_LANGUAGE_SCHEMA_URI)).toHaveLength(1)
  })

  it('is idempotent when another query editor is configured', () => {
    const firstRegistration = mergeQueryLanguageSchemaRegistration()
    const secondRegistration = mergeQueryLanguageSchemaRegistration(firstRegistration)

    expect(secondRegistration).toHaveLength(1)
    expect(hasQueryLanguageSchemaRegistration(secondRegistration)).toBe(true)
  })
})
