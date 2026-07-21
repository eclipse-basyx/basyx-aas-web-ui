import type { AdministrativeInformation, CompanyDescriptor, Endpoint } from '@/composables/Client/CompanyLookup/types/company'

export function emptyFormData (): CompanyDescriptor {
  return {
    idShort: '',
    name: '',
    domain: '',
    displayName: [],
    description: [],
    endpoints: [{ interface: '', protocolInformation: { href: '' } }],
    nameOptions: [],
    assetIdRegexPatterns: [],
  }
}

export function emptyAdministration (): AdministrativeInformation {
  return { version: null, revision: null, creator: null }
}

export function emptyEndpoint (): Endpoint {
  return { interface: '', protocolInformation: { href: '' } }
}
