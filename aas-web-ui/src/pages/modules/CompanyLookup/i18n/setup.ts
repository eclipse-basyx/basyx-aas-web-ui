import { type Composer, createI18n } from 'vue-i18n'
import { type Locale, Locales } from '../types/locale'
import { type CompanyLookupI18NSchema, de, en } from './locales'

// Note: initial locale is always the default; index.vue syncs it to the

// Module-scoped i18n
const companyLookupI18n = createI18n({
  legacy: false,
  locale: Locales.EN,
  fallbackLocale: Locales.EN,
  messages: { en, de },
})
export const i18nGlobal = companyLookupI18n.global as unknown as Composer<{ en: CompanyLookupI18NSchema, de: CompanyLookupI18NSchema }, {}, {}, Locale>

export { type CompanyLookupI18NSchema } from './locales'
