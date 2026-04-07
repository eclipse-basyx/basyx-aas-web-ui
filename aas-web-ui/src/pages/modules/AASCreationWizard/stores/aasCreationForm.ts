import type { DigitalNameplateTemplate } from '../types/template'
import { defineStore } from 'pinia'

export type LangText = {
  language: string
  text: string
}

export type AssetDataForm = {
  aasId: string
  displayName: string
  description: string
  assetKind: 'Instance' | 'Type'
  globalAssetId: string
  thumbnailFile: File | null
}

export const useAASCreationStore = defineStore('aasCreationForm', {
  state: () => ({
    assetData: {
      aasId: '',
      displayName: '',
      description: '',
      assetKind: 'Instance' as 'Instance' | 'Type',
      globalAssetId: '',
      thumbnailFile: null as File | null,
    } as AssetDataForm,

    digitalNameplateData: null as DigitalNameplateTemplate | null,
    technicalDataData: null as Record<string, any> | null,
    handoverDocumentationData: null as Record<string, any> | null,
  }),

  actions: {
    saveAssetData (data: AssetDataForm) {
      this.assetData = { ...data }
    },

    setThumbnailFile (file: File | null) {
      this.assetData.thumbnailFile = file
    },

    saveDigitalNameplateData (data: DigitalNameplateTemplate) {
      this.digitalNameplateData = data
    },

    saveTechnicalDataData (data: Record<string, any>) {
      this.technicalDataData = data
    },

    saveHandoverDocumentationData (data: Record<string, any>) {
      this.handoverDocumentationData = data
    },
  },
  getters: {
    getAssetData: state => state.assetData,
  },
})
