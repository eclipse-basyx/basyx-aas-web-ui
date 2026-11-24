/** Whether two EDC resources, e.g. assets or catalog datasets, have the same `@id`; false when either has none */
export function isSameEdcResource (resource: any, other: any): boolean {
  return !!resource?.['@id'] && resource['@id'] === other?.['@id']
}
