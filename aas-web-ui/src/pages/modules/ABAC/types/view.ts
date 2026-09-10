export const VIEW = {
  RULES: 'rules',
  DEFINITIONS: 'definitions',
} as const

export type ViewType = typeof VIEW[keyof typeof VIEW]
