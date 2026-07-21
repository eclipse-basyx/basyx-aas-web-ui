/* eslint-disable unicorn/no-this-outside-of-class */
import { defineStore } from 'pinia'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { type Locale, Locales } from '../types/locale'

const STORE_KEY = 'COMPANY_LOOKUP_CONFIG_STORE'

const STORAGE_KEYS = {
  language: 'company_lookup.language',
} as const

export interface CompanyLookupConfig {
  language: Locale
  apiUrl: string
}

type ConfigStoreState = CompanyLookupConfig & {
  isInitialized: boolean
  isInitializing: boolean
}

function getLocalStorageItem (key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(key)
}

function setLocalStorageItem (key: string, value: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(key, value)
}

export const useCompanyLookupConfigStore = defineStore(STORE_KEY, {
  state: (): ConfigStoreState => ({
    language: Locales.EN,
    apiUrl: '',
    isInitialized: false,
    isInitializing: false,
  }),
  actions: {
    async initialize () {
      if (this.isInitialized || this.isInitializing) {
        return
      }

      this.isInitializing = true

      try {
        const infrastructureStore = useInfrastructureStore()
        const companyLookupApiUrl = computed(() => infrastructureStore.getCompanyLookupURL)

        const storedLanguage = getLocalStorageItem(STORAGE_KEYS.language) as Locale | null

        this.language = storedLanguage ?? Locales.EN
        this.apiUrl = companyLookupApiUrl?.value ?? ''

        this.isInitialized = true
      } finally {
        this.isInitializing = false
      }
    },
    setLanguage (lang: Locale) {
      this.language = lang
      setLocalStorageItem(STORAGE_KEYS.language, lang)
    },
  },
})
