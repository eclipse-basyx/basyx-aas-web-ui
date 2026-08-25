import { inject } from 'vue'
import { ABAC_I18N_KEY, type I18nComposer } from '@/pages/modules/ABAC/constants/i18n'

interface AbacI18n {
  t: I18nComposer['t']
  tm: I18nComposer['tm']
  i18nData: (key: string) => { 'data-i18n-key': string }
}

export function useAbacI18n (): AbacI18n {
  const i18n = inject(ABAC_I18N_KEY) as I18nComposer | undefined

  if (!i18n) {
    throw new Error('[ABAC] i18n was not provided. Did you forget to provide ABAC_I18N_KEY in index.vue?')
  }

  function i18nData (key: string) {
    return { 'data-i18n-key': key }
  }

  return {
    t: i18n.t,
    tm: i18n.tm,
    i18nData,
  }
}
