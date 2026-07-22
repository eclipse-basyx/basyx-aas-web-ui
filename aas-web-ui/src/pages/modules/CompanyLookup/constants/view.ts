export const VIEW = {
  DETAILS: 'details',
  JSON: 'json',
} as const

// Derive types and valid values dynamically from the VIEW object
export type ViewType = typeof VIEW[keyof typeof VIEW]
export const VIEWS = Object.values(VIEW) as string[]
