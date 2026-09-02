import {
  QUERY_LANGUAGE_SCHEMA_URI,
  queryLanguageSchema,
} from './queryLanguageSchema'

export interface QueryLanguageSchemaRegistration {
  fileMatch?: string[]
  schema?: unknown
  uri: string
}

export const QUERY_LANGUAGE_MODEL_PATTERN = 'inmemory://aas-query-language/*.json'

export function hasQueryLanguageSchemaRegistration (
  schemas: readonly QueryLanguageSchemaRegistration[] = [],
): boolean {
  return schemas.some(schema =>
    schema.uri === QUERY_LANGUAGE_SCHEMA_URI
    && schema.schema === queryLanguageSchema
    && schema.fileMatch?.length === 1
    && schema.fileMatch[0] === QUERY_LANGUAGE_MODEL_PATTERN,
  )
}

export function mergeQueryLanguageSchemaRegistration (
  schemas: readonly QueryLanguageSchemaRegistration[] = [],
): QueryLanguageSchemaRegistration[] {
  return [
    ...schemas.filter(schema => schema.uri !== QUERY_LANGUAGE_SCHEMA_URI),
    {
      fileMatch: [QUERY_LANGUAGE_MODEL_PATTERN],
      schema: queryLanguageSchema,
      uri: QUERY_LANGUAGE_SCHEMA_URI,
    },
  ]
}
