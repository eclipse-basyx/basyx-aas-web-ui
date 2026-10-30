import { type Composer, createI18n } from 'vue-i18n'
import { type Locale, Locales } from '../types/locale'
import { type AbacI18NSchema, de, en } from './locales'

// Note: initial locale is always the default; index.vue syncs it to the
// config store language setting via a watcher.

// Module-scoped i18n
const abacI18n = createI18n({
  legacy: false,
  locale: Locales.EN,
  fallbackLocale: Locales.EN,
  messages: { en, de },
})

export const i18nGlobal = abacI18n.global as unknown as Composer<{ en: AbacI18NSchema, de: AbacI18NSchema }, {}, {}, Locale>

export { type AbacI18NSchema } from './locales'
