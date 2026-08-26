/* eslint-disable unicorn/no-this-outside-of-class */
import type { AbacService } from '@/pages/modules/ABAC/types/service'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { defineStore } from 'pinia'
import { type Locale, Locales } from '@/pages/modules/ABAC/types/locale'
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/storage'

const STORE_KEY = 'ABAC_CONFIG_STORE'

const STORAGE_KEYS = {
  language: 'abac.language',
} as const

export interface AbacConfig {
  language: Locale
  apiUrl: string
  services: AbacService[]
}

type ConfigStoreState = AbacConfig & {
  isInitialized: boolean
  isInitializing: boolean
}

export const useAbacConfigStore = defineStore(STORE_KEY, {
  state: (): ConfigStoreState => ({
    language: Locales.EN,
    apiUrl: '',
    services: [],
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
        const storedLanguage = getLocalStorageItem(STORAGE_KEYS.language) as Locale | null
        this.language = storedLanguage ?? Locales.EN

        this.isInitialized = true
      } finally {
        this.isInitializing = false
      }
    },
    setLanguage (locale: Locale) {
      this.language = locale
      setLocalStorageItem(STORAGE_KEYS.language, locale)
    },
    setApiUrl (url: string) {
      this.apiUrl = url
    },
    initializeServices (newServices: AbacService[], componentKey?: BaSyxComponentKey) {
      if (newServices.length === 0) {
        this.services = []
        this.apiUrl = ''
        return false
      }

      this.services = newServices

      if (componentKey) {
        const url = newServices.find(s => s.componentKey === componentKey)?.url
        if (url) {
          this.apiUrl = url
          return true
        }
        this.apiUrl = ''
        return false // component not found in discovered services
      }

      // No component specified: auto-select first available
      const first = newServices.find(s => s.available) ?? newServices[0]
      if (first) {
        this.apiUrl = first.url
        return true
      }
      return false
    },
  },
})
