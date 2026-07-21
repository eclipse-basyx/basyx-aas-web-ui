export const COMPANY_LOOKUP_ENDPOINT_PATHS = {
  COMPANIES: '/companies',
  DESCRIPTION: '/description',
} as const

export const CONTEXT = {
  GET_ALL: 'retrieving all company descriptors',
  GET_COMPANY: 'retrieving company descriptor by domain id',
  GET_DESCRIPTION: 'retrieving service description',
  POST: 'creating company descriptor',
  PUT: 'updating company descriptor',
  DELETE: 'deleting company descriptor',
} as const
