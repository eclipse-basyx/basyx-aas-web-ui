<template>
  <!-- Toggle between File and URL -->
  <v-btn-toggle
    v-model="toggle"
    class="mb-3"
    color="primary"
    density="compact"
    divided
    variant="outlined"
  >
    <v-btn value="none">
      <span>None</span>
    </v-btn>

    <v-btn value="file">
      <span>File</span>
    </v-btn>

    <v-btn value="url">
      <span>URL</span>
    </v-btn>
  </v-btn-toggle>
  <!-- URL based File -->
  <v-list-item v-if="toggle === 'url'" class="px-0">
    <template #prepend>
      <v-combobox
        v-model="contentTypeValue"
        class="mr-3 mt-2"
        density="comfortable"
        :items="contentTypeOptions"
        label="Content Type"
        placeholder="Select or enter Content Type"
        variant="outlined"
        :width="200"
      />
    </template>

    <v-text-field
      v-model="pathValue"
      class="mt-2"
      density="comfortable"
      label="Path"
      variant="outlined"
      @update:model-value="
        errorLoadingImage = false;
        updateFilePreview();
      "
    />
  </v-list-item>
  <!-- URL File Preview -->
  <v-sheet
    v-if="toggle === 'url' && pathValue && pathValue.length > 0 && contentTypeValue.includes('image')"
    border
    class="mb-4"
    rounded
  >
    <v-img
      v-if="!errorLoadingImage"
      contain
      max-height="100%"
      max-width="100%"
      rounded
      :src="filePreviewPath"
      @error="errorLoadingImage = true"
    />

    <v-alert
      v-else
      density="compact"
      text="No File preview available"
      type="warning"
      variant="outlined"
    />
  </v-sheet>

  <v-file-upload v-if="toggle === 'file'" v-model="file" clearable density="default" />
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue'
  import { useUrlUtils } from '@/composables/UrlUtils'

  const props = defineProps<{
    path: string | null
    contentType: string
    newFile: boolean
    smePath?: string
  }>()

  const emit = defineEmits<{
    (event: 'update:path', value: string | null): void
    (event: 'update:contentType', value: string): void
    (event: 'update:file', value: File | undefined): void
  }>()

  // Composables
  const { getBlobUrl } = useUrlUtils()

  const pathValue = ref<string | null>(props.path)
  const contentTypeValue = ref<string>(props.contentType)
  const file = ref<File | undefined>(undefined)
  const toggle = ref<string>('none')
  const errorLoadingImage = ref<boolean>(false)
  const filePreviewPath = ref<string>('')
  const contentTypeOptions = ref<string[]>([
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/heic',
    'image/heif',
    'application/json',
    'application/xml',
    'text/xml',
    'application/pdf',
  ])

  watch(pathValue, newValue => {
    if (toggle.value === 'none') {
      emit('update:path', null)
      return
    }
    emit('update:path', newValue)
    updateFilePreview()
  })

  watch(contentTypeValue, newValue => {
    if (newValue === null) {
      return
    }
    emit('update:contentType', newValue)
    updateFilePreview()
  })

  watch(
    () => props.path,
    newValue => {
      pathValue.value = newValue
      // Set toggle to 'url' if it's not a new file and has a valid path
      if (!props.newFile && newValue && newValue.trim().length > 0) {
        toggle.value = 'url'
      }
      updateFilePreview()
    },
  )

  watch(
    () => props.contentType,
    newValue => {
      contentTypeValue.value = newValue
      updateFilePreview()
    },
  )

  watch(
    () => toggle.value,
    newValue => {
      switch (newValue) {
        case 'none': {
          pathValue.value = null
          contentTypeValue.value = 'application/unknown'
          file.value = undefined
          emit('update:file', undefined)
          filePreviewPath.value = ''

          break
        }
        case 'url': {
          file.value = undefined
          emit('update:file', undefined)
          updateFilePreview()

          break
        }
        case 'file': {
          pathValue.value = null
          emit('update:path', null)
          filePreviewPath.value = ''

          break
        }
      // No default
      }
    },
  )

  watch(file, newValue => {
    if (newValue === null) {
      return
    }
    emit('update:file', newValue)
  })

  onMounted(() => {
    // Set toggle to 'url' if it's not a new file and has a valid path
    if (!props.newFile && props.path && props.path.trim().length > 0) {
      toggle.value = 'url'
    }
    updateFilePreview()
  })

  async function updateFilePreview (): Promise<void> {
    if (pathValue.value === null || !contentTypeValue.value.includes('image') || pathValue.value.trim() === '') {
      filePreviewPath.value = ''
      errorLoadingImage.value = false
      return
    }

    // Reset error state when updating preview
    errorLoadingImage.value = false

    try {
      if (pathValue.value.startsWith('http')) {
        // External URL - return it directly for external URLs
        filePreviewPath.value = pathValue.value
      } else if (props.smePath) {
        // Internal path - construct the API endpoint and use getBlobUrl with authentication
        const apiPath = props.smePath + '/attachment'
        filePreviewPath.value = await getBlobUrl(apiPath, false)
      } else {
        filePreviewPath.value = ''
      }
    } catch (error) {
      console.error('Error updating file preview:', error)
      filePreviewPath.value = ''
      errorLoadingImage.value = true
    }
  }
</script>
