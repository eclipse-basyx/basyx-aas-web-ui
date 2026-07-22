import { inject } from 'vue'
import { COMPANY_LOOKUP_I18N_KEY, type I18nComposer } from '../constants/i18n'

interface CompanyLookupI18n {
  t: I18nComposer['t']
  tm: I18nComposer['tm']
  i18nData: (key: string) => { 'data-i18n-key': string }
  // add other properties as needed
}

export function useCompanyLookupI18n (): CompanyLookupI18n {
  const i18n = inject(COMPANY_LOOKUP_I18N_KEY) as I18nComposer | undefined

  if (!i18n) {
    throw new Error('[CompanyLookup] i18n was not provided. Did you forget to provide COMPANY_LOOKUP_I18N_KEY in index.vue?')
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
