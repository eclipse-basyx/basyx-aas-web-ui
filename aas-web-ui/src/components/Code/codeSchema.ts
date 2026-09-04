export interface CodeSchema {
  fileMatch?: string[]
  schema?: unknown
  uri: string
}

export function mergeCodeSchemas (current: readonly CodeSchema[], additions: readonly CodeSchema[]): CodeSchema[] {
  const replacements = new Map(additions.map(schema => [schema.uri, schema]))
  return [...current.filter(schema => !replacements.has(schema.uri)), ...replacements.values()]
}
