import type { TechnicalPropertyAreaEditorItem } from '../types/arbitrary'
import type { FormStateObject } from '../types/form'
import type { DigitalNameplateTemplate, HandoverDocumentationTemplate, TechnicalDataTemplate } from '../types/template'
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

function createInitialAssetData (): AssetDataForm {
  return {
    aasId: '',
    displayName: '',
    description: '',
    assetKind: 'Instance' as 'Instance' | 'Type',
    globalAssetId: '',
    thumbnailFile: null as File | null,
  }
}

export const useAASCreationStore = defineStore('aasCreationForm', {
  state: () => ({
    assetData: createInitialAssetData(),

    digitalNameplateData: null as DigitalNameplateTemplate | null,
    technicalDataData: null as TechnicalDataTemplate | null,
    handoverDocumentationData: null as HandoverDocumentationTemplate | null,

    digitalNameplateFormState: null as FormStateObject | null,
    technicalDataFormState: null as FormStateObject | null,
    technicalPropertyAreas: [] as TechnicalPropertyAreaEditorItem[],
    handoverDocumentationFormState: null as FormStateObject | null,
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

    saveTechnicalDataData (data: TechnicalDataTemplate) {
      this.technicalDataData = data
    },

    saveHandoverDocumentationData (data: HandoverDocumentationTemplate) {
      this.handoverDocumentationData = data
    },
    saveDigitalNameplateFormState (data: FormStateObject) {
      this.digitalNameplateFormState = structuredClone(data)
    },
    saveTechnicalDataFormState (data: FormStateObject) {
      this.technicalDataFormState = structuredClone(data)
    },
    saveTechnicalPropertyAreas (data: TechnicalPropertyAreaEditorItem[]) {
      this.technicalPropertyAreas = structuredClone(data)
    },
    saveHandoverDocumentationFormState (data: FormStateObject) {
      this.handoverDocumentationFormState = structuredClone(data)
    },

    resetCreationState () {
      this.assetData = createInitialAssetData()
      this.digitalNameplateData = null
      this.technicalDataData = null
      this.handoverDocumentationData = null
      this.digitalNameplateFormState = null
      this.technicalDataFormState = null
      this.technicalPropertyAreas = [] as TechnicalPropertyAreaEditorItem[]
      this.handoverDocumentationFormState = null
    },
  },
  getters: {
    getAssetData: state => state.assetData,
  },
})
