export const Locales = {
  DE: 'de',
  EN: 'en',
} as const

export type Locale = (typeof Locales)[keyof typeof Locales]
