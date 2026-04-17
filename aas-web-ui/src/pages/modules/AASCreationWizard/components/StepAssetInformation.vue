<template>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <v-form ref="formRef" @submit.prevent="saveAndNext">
        <v-row>
          <!-- <v-col cols="12">
            <div class="mb-6">
              <div class="text-h6 font-weight-bold">Asset Information</div>
              <div class="text-body-2 text-medium-emphasis">Basic information about the asset</div>
            </div>
          </v-col> -->

          <v-col cols="12" md="6">
            <FormField
              label="AAS ID *"
              tip="Legally valid name under which a company or organization is registered and conducts business"
            >
              <v-text-field
                v-model="form.aasId"
                density="comfortable"
                hide-details="auto"
                :rules="aasIdRules"
                variant="outlined"
              />
            </FormField>
          </v-col>

          <v-col cols="12" md="6">
            <FormField label="Asset Kind *" tip="Asset Kind">
              <v-select
                v-model="form.assetKind"
                density="comfortable"
                hide-details="auto"
                :items="assetKindOptions"
                :rules="assetKindRules"
                variant="outlined"
              />
            </FormField>
          </v-col>

          <v-col cols="12">
            <FormField label="Display Name" tip="Name of the asset">
              <v-text-field
                v-model="form.displayName"
                density="comfortable"
                hide-details="auto"
                variant="outlined"
              />
            </FormField>
          </v-col>

          <v-col cols="12">
            <FormField label="Description" tip="description of the asset">
              <v-textarea
                v-model="form.description"
                auto-grow
                density="comfortable"
                hide-details="auto"
                rows="3"
                variant="outlined"
              />
            </FormField>
          </v-col>

          <v-col cols="12">
            <FormField label="Global Asset ID *" tip="global asset id">
              <v-text-field
                v-model="form.globalAssetId"
                density="comfortable"
                hide-details="auto"
                :rules="globalAssetIdRules"
                variant="outlined"
              />
            </FormField>
          </v-col>

          <v-col cols="12">
            <FormField label="Thumbnail" tip="attach a picture of image in common format (.png, .jpg)">
              <v-file-input
                accept="image/*"
                density="comfortable"
                hide-details="auto"
                placeholder="click or drag and drop"
                prepend-icon="mdi-image"
                variant="outlined"
                @update:model-value="onThumbnailSelected"
              />
            </FormField>
          </v-col>

          <v-col class="d-flex justify-end" cols="12">
            <v-btn color="primary" type="submit"> Next </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue'
  import { type AssetDataForm, useAASCreationStore } from '../stores/aasCreationForm'
  import FormField from './FormField.vue'

  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()

  const store = useAASCreationStore()
  const formRef = ref()

  const form = reactive<AssetDataForm>({
    aasId: '',
    displayName: '',
    description: '',
    assetKind: 'Instance',
    globalAssetId: '',
    thumbnailFile: null as File | null,
  })

  // const assetKindOptions = ['Instance', 'Type'];
  const assetKindOptions: AssetDataForm['assetKind'][] = ['Instance', 'Type']

  const aasIdRules = [(v: string) => !!(v && v.trim()) || 'AAS ID is required.']

  const assetKindRules = [(v: string) => !!(v && v.trim()) || 'Asset Kind is required.']

  const globalAssetIdRules = [(v: string) => !!(v && v.trim()) || 'Global Asset ID is required.']

  onMounted(() => {
    const storedData = store.getAssetData

    form.aasId = storedData.aasId
    form.displayName = storedData.displayName
    form.description = storedData.description
    form.assetKind = storedData.assetKind
    form.globalAssetId = storedData.globalAssetId
    form.thumbnailFile = storedData.thumbnailFile
  })

  function onThumbnailSelected (file: File | File[] | null): void {
    const selectedFile = Array.isArray(file) ? file[0] : file
    form.thumbnailFile = selectedFile ?? null
  }

  async function saveAndNext (): Promise<void> {
    if (!props.isActiveComponent) {
      return
    }

    const result = await formRef.value?.validate?.()

    if (result && result.valid === false) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    store.saveAssetData({
      aasId: form.aasId.trim(),
      displayName: form.displayName.trim(),
      description: form.description.trim(),
      assetKind: form.assetKind,
      globalAssetId: form.globalAssetId.trim(),
      thumbnailFile: form.thumbnailFile,
    })
    console.log('form', form)
    props.next()
  }
</script>
