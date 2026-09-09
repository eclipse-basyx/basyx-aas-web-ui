export const VIEW = {
  RULES: 'rules',
  DEFINITIONS: 'definitions',
  RAW: 'raw',
} as const

export type ViewType = typeof VIEW[keyof typeof VIEW]
