/**
 * Loads official IDTA submodel examples from https://github.com/admin-shell-io/submodel-templates at test time.
 * The examples are not copied into this repository; without network access the dependent tests are skipped.
 */

import { download } from './download'

const SUBMODEL_TEMPLATES_RAW = 'https://raw.githubusercontent.com/admin-shell-io/submodel-templates/main/published'

export const RAILWAY_FIRE_PROTECTION_EXAMPLE_URL = `${SUBMODEL_TEMPLATES_RAW}/${encodeURI(
  'Fire Protection on Railway Vehicles/1/0/IDTA 02102_Example Fire Protection on Railway Vehicles.json',
)}`

const cache = new Map<string, Promise<any | null>>()

/** The environment (AAS, submodels, concept descriptions) of an IDTA example, or null if it cannot be loaded */
export function loadIdtaExample (url: string, timeoutMs = 15_000): Promise<any | null> {
  if (!cache.has(url)) {
    cache.set(url, download(url, 'IDTA example', response => response.json(), timeoutMs))
  }
  return cache.get(url)!
}

/** First submodel of an IDTA example with the given idShort, as a fresh copy */
export async function loadIdtaExampleSubmodel (url: string, idShort: string): Promise<any | null> {
  const environment = await loadIdtaExample(url)
  const submodel = environment?.submodels?.find((entry: any) => entry.idShort === idShort)
  return submodel ? structuredClone(submodel) : null
}
