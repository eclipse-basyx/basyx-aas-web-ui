<template>
  <!-- Toggle between None and Blob -->
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

    <v-btn value="blob">
      <span>Blob</span>
    </v-btn>
  </v-btn-toggle>
  <!-- Content Type Selection -->
  <v-combobox
    v-if="toggle === 'blob'"
    v-model="contentTypeValue"
    class="mt-2"
    density="comfortable"
    :items="contentTypeOptions"
    label="Content Type"
    placeholder="Select or enter Content Type"
    variant="outlined"
  />
  <!-- Blob File Upload -->
  <v-file-upload
    v-if="toggle === 'blob'"
    v-model="blob"
    clearable
    density="default"
    :multiple="false"
  />
  <!-- Blob Preview -->
  <v-sheet
    v-if="toggle === 'blob' && contentValue && contentValue.length > 0 && contentTypeValue.includes('image')"
    border
    class="mt-6"
    rounded
  >
    <v-img
      v-if="!errorLoadingImage"
      contain
      max-height="100%"
      max-width="100%"
      rounded
      :src="blobPreviewPath"
      @error="errorLoadingImage = true"
    />

    <v-alert
      v-else
      density="compact"
      text="No Blob preview available"
      type="warning"
      variant="outlined"
    />
  </v-sheet>
  <!-- Blob Content Summary -->
  <v-card v-if="toggle === 'blob' && contentValue" border class="mt-6">
    <v-card-text>
      <div class="d-flex align-center justify-space-between">
        <div><strong>Blob Size:</strong> {{ formatFileSize(contentValue.length) }}</div>

        <v-btn
          v-if="!showFullContent"
          color="primary"
          :disabled="contentValue.length > maxSafeSize"
          variant="text"
          @click="showFullContent = true"
        >
          Show Content
        </v-btn>

        <v-btn v-else color="primary" variant="text" @click="showFullContent = false"> Hide Content </v-btn>
      </div>

      <v-alert
        v-if="contentValue.length > maxSafeSize"
        class="mt-2"
        density="compact"
        type="warning"
        variant="tonal"
      >
        Blob content is too large to display safely ({{ formatFileSize(contentValue.length) }}).
      </v-alert>
    </v-card-text>
  </v-card>

  <!-- Optimized Textarea (only displayed when explicitly requested) -->
  <v-textarea
    v-if="toggle === 'blob' && showFullContent && contentValue && contentValue.length <= maxSafeSize"
    v-model="displayedContent"
    class="mt-3"
    clearable
    density="comfortable"
    hide-details
    label="Blob Content"
    :loading="isContentLoading"
    readonly
    variant="outlined"
  />
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'

  const props = defineProps<{
    content: Uint8Array | null
    contentType: string
    newBlob: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:content', value: Uint8Array | null): void
    (event: 'update:contentType', value: string): void
    (event: 'update:blob', value: File | undefined): void
  }>()

  const contentValue = ref<Uint8Array | null>(props.content)
  const contentTypeValue = ref<string>(props.contentType)
  const blob = ref<File | undefined>(undefined)
  const toggle = ref<string>('none')
  const errorLoadingImage = ref<boolean>(false)
  const isContentLoading = ref<boolean>(false)
  const showFullContent = ref<boolean>(false)
  const displayedContent = ref<string>('')
  const maxSafeSize = 1024 * 1024 // 1MB threshold for safe display
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
  ])

  watch(contentValue, newValue => {
    if (toggle.value === 'none') {
      emit('update:content', null)
      return
    }
    emit('update:content', newValue)
  })

  watch(contentTypeValue, newValue => {
    if (newValue === null) {
      return
    }
    emit('update:contentType', newValue)
  })

  watch(
    () => props.content,
    newValue => {
      contentValue.value = newValue
    },
  )

  watch(
    () => props.contentType,
    newValue => {
      contentTypeValue.value = newValue
    },
  )

  watch(
    () => toggle.value,
    newValue => {
      if (newValue === 'none') {
        contentValue.value = null
        contentTypeValue.value = 'application/unknown'
        blob.value = undefined
      }
    },
  )

  watch(blob, newValue => {
    if (newValue === null) {
      return
    }
    convertToBlob(newValue)
    emit('update:blob', newValue)
  })

  watch(showFullContent, async show => {
    if (show && contentValue.value) {
      isContentLoading.value = true
      // Using nextTick and setTimeout to not block the UI
      await new Promise(resolve => setTimeout(resolve, 0))
      try {
        // Decode the blob content if it seems to be text
        if (isTextContentType(contentTypeValue.value)) {
          const decoder = new TextDecoder('utf-8')
          displayedContent.value = decoder.decode(contentValue.value)
        } else {
          // For binary data, show a hex representation
          displayedContent.value = Array.from(contentValue.value)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ')
        }
      } catch (error) {
        console.error('Error rendering content:', error)
        displayedContent.value = 'Error rendering content'
      } finally {
        isContentLoading.value = false
      }
    }
  })

  onMounted(() => {
    if (
      !props.newBlob
      && props.content
      && props.content.length > 0
      && props.contentType !== 'application/unknown'
    ) {
      toggle.value = 'blob'
    }
  })

  const blobPreviewPath = computed(() => {
    if (contentValue.value === null || !contentTypeValue.value.includes('image')) {
      return ''
    }
    const uint8Array = new Uint8Array(contentValue.value)
    const blob = new Blob([uint8Array], { type: contentTypeValue.value })
    return URL.createObjectURL(blob)
  })

  async function convertToBlob (file: File | undefined): Promise<void> {
    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      contentValue.value = new Uint8Array(arrayBuffer)

      contentTypeValue.value = file.type
    } else {
      contentValue.value = null
    }
  }

  function formatFileSize (bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function isTextContentType (contentType: string): boolean {
    return /^text\/|application\/(json|xml|javascript|x-javascript)/i.test(contentType)
  }
</script>
