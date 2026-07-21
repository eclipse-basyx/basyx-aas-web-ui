import type { CompanyLookupI18NSchema } from '../i18n/setup'
import type { Locale } from '../types/locale'
import type { InjectionKey } from 'vue'
import type { Composer } from 'vue-i18n'

export type I18nComposer = Composer<{ en: CompanyLookupI18NSchema, de: CompanyLookupI18NSchema }, {}, {}, Locale>

export const COMPANY_LOOKUP_I18N_KEY: InjectionKey<I18nComposer> = Symbol('COMPANY_LOOKUP_I18N')
