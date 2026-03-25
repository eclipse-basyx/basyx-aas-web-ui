<template>
  <v-container class="pa-0" fluid>
    <v-card>
      <v-img
        v-if="imageUrl.length > 0"
        contain
        max-height="100%"
        max-width="100%"
        :src="imageUrl"
        @error="errorLoadingImage = true"
      />
      <v-img
        v-else
        contain
        max-height="100%"
        max-width="100%"
        :src="Base64Image"
        @error="errorLoadingImage = true"
      />
      <!-- Error Message -->
      <v-alert
        v-if="errorLoadingImage"
        density="compact"
        text="No Image found at given Path!"
        type="warning"
        variant="outlined"
      />
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'

  // Composables
  const { valueBlob } = useSMEFile()

  // Properties
  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })

  // Data
  const Base64Image = ref('') // Base64 Image String
  const imageUrl = ref('') // Image URL
  const errorLoadingImage = ref(false)

  // Watchers
  watch(
    () => props.submodelElementData,
    () => {
      initialize()
    },
  )

  onMounted(() => {
    initialize()
  })

  async function initialize (): Promise<void> {
    Base64Image.value = ''
    imageUrl.value = ''
    if (props.submodelElementData.modelType === 'File') {
      Base64Image.value = await valueBlob(props.submodelElementData)
    } else if (props.submodelElementData.modelType == 'Blob') {
      getDecodedImageBlob()
    }
    errorLoadingImage.value = false
  }

  function getDecodedImageBlob (): void {
    const decodedValue = atob(props.submodelElementData.value)
    Base64Image.value = `data:${props.submodelElementData.contentType};base64,${decodedValue}`
  }
</script>
