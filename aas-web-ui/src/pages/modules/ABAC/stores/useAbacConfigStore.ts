/* eslint-disable unicorn/no-this-outside-of-class */
import { defineStore } from 'pinia'
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/storage'
import { type Locale, Locales } from '../types/locale'

const STORE_KEY = 'ABAC_CONFIG_STORE'

const STORAGE_KEYS = {
  language: 'abac.language',
} as const

export interface AbacConfig {
  language: Locale
}

type ConfigStoreState = AbacConfig & {
  isInitialized: boolean
  isInitializing: boolean
}

export const useAbacConfigStore = defineStore(STORE_KEY, {
  state: (): ConfigStoreState => ({
    language: Locales.EN,
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
  },
})
