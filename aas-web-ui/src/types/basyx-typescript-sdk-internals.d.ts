declare module 'basyx-typescript-sdk/dist/lib/aas-dataformat-xml/xmlization.js' {
  export function deserializeXml (xml: string): unknown
  export function serializeXml (value: unknown): string
}

declare module 'basyx-typescript-sdk/dist/models/BaSyxEnvironment.js' {
  export class BaSyxEnvironment {
    constructor (
      assetAdministrationShells?: unknown[],
      submodels?: unknown[],
      conceptDescriptions?: unknown[],
    )
  }
}
