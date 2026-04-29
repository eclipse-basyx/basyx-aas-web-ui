export function stripRuntimeMetadata<T extends Record<string, unknown>> (element: T): T {
  const { _cardinality, ...rest } = element
  return rest as T
}

export function formatIndexedIdShort (baseIdShort: string, index: number): string {
  const indexedPattern = /__\d{2}__$/

  if (indexedPattern.test(baseIdShort)) {
    return baseIdShort.replace(indexedPattern, `__${String(index).padStart(2, '0')}__`)
  }

  return `${baseIdShort}__${String(index).padStart(2, '0')}__`
}
