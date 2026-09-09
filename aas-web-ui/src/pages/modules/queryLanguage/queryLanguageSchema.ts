import sourceSchema from './query-language.schema.json'

export interface JsonSchema {
  [key: string]: unknown
  definitions?: Record<string, unknown>
}

export const QUERY_LANGUAGE_SCHEMA_URI = 'https://admin-shell.io/aas-query-language/query.schema.json'

export function createQueryLanguageSchema (schema: JsonSchema = sourceSchema): JsonSchema {
  if (!schema.definitions?.Query) {
    throw new Error('The query language schema must define #/definitions/Query.')
  }

  return {
    ...schema,
    title: 'AAS Query Language Query',
    oneOf: [
      { $ref: '#/definitions/Query' },
    ],
  }
}

export const queryLanguageSchema = createQueryLanguageSchema()
