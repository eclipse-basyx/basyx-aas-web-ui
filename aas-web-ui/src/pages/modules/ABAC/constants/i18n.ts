import type { AbacI18NSchema } from '../i18n/setup'
import type { Locale } from '../types/locale'
import type { InjectionKey } from 'vue'
import type { Composer } from 'vue-i18n'

export type I18nComposer = Composer<{ en: AbacI18NSchema, de: AbacI18NSchema }, {}, {}, Locale>

export const ABAC_I18N_KEY: InjectionKey<I18nComposer> = Symbol('ABAC_I18N')
