<template>
  <v-card :class="{ 'd-flex flex-column': fill }">
    <v-card-title class="d-flex align-center flex-wrap ga-1">
      <v-icon v-if="icon" class="mr-2">{{ icon }}</v-icon>
      {{ title }}
      <v-spacer />

      <template v-if="hasContent">
        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              aria-label="Search"
              icon="mdi-magnify"
              variant="text"
              @click="codeEditor?.find()"
            />
          </template>

          <span>
            <v-hotkey class="mr-2" keys="cmd+f" />
            Search
          </span>
        </v-tooltip>

        <v-btn
          :aria-label="wordWrap ? 'Disable word wrap' : 'Enable word wrap'"
          :icon="wordWrap ? 'mdi-wrap-disabled' : 'mdi-wrap'"
          :title="wordWrap ? 'Disable word wrap' : 'Enable word wrap'"
          variant="text"
          @click="wordWrap = !wordWrap"
        />

        <v-btn
          :aria-label="lineNumbers ? 'Hide line numbers' : 'Show line numbers'"
          icon="mdi-format-list-numbered"
          :title="lineNumbers ? 'Hide line numbers' : 'Show line numbers'"
          variant="text"
          @click="lineNumbers = !lineNumbers"
        />

        <v-btn
          v-if="fileName"
          :aria-label="downloadLabel"
          icon="mdi-download"
          :title="downloadLabel"
          variant="text"
          @click="download"
        />

        <v-btn
          :aria-label="copyLabel"
          :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
          :title="copyLabel"
          variant="text"
          @click="copy"
        />
      </template>
    </v-card-title>

    <v-divider />

    <v-card-text :class="{ 'd-flex flex-column flex-1-1-0 code-viewer__fill': fill }">
      <v-progress-linear v-if="loading" aria-label="Loading preview" indeterminate />
      <v-alert v-else-if="error" role="alert" type="error" variant="tonal">{{ error }}</v-alert>
      <v-empty-state v-else-if="!text && readOnly" :title="emptyMessage" />

      <CodeEditor
        v-else
        ref="codeEditor"
        :accessible-label="title"
        :class="{ 'flex-1-1-0 code-viewer__fill': fill }"
        :error="invalid"
        :height="fill ? '100%' : height"
        :language="language"
        :model-value="text"
        :options="{ wordWrap: wordWrap ? 'on' : 'off', lineNumbers: lineNumbers ? 'on' : 'off' }"
        :read-only="readOnly"
        @update:model-value="emit('update:text', $event)"
      />

      <v-alert
        v-if="copyError"
        class="mt-2"
        role="alert"
        type="error"
        variant="tonal"
      >{{ copyError }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { downloadFile } from '@/utils/generalUtils'

  const props = withDefaults(defineProps<{
    text: string
    exportText?: string
    language?: 'json' | 'xml' | 'plaintext'
    title?: string
    icon?: string
    fileName?: string
    mimeType?: string
    height?: string
    fill?: boolean // The editor fills the height left in a flex column parent; `height` is ignored then
    loading?: boolean
    error?: string | null
    emptyMessage?: string
    copyLabel?: string
    downloadLabel?: string
    readOnly?: boolean // false: the text can be edited, each edit by hand emits `update:text`
    invalid?: boolean // Marks the editor as invalid, e.g. an edited text that is no valid JSON
  }>(), {
    language: 'json',
    title: 'JSON Preview',
    mimeType: 'application/json',
    height: '600px',
    fill: false,
    emptyMessage: 'No content available',
    copyLabel: 'Copy to clipboard',
    downloadLabel: 'Download',
    readOnly: true,
    invalid: false,
  })

  const emit = defineEmits<{
    'update:text': [value: string]
  }>()

  const codeEditor = ref<{ find: () => void }>()
  const wordWrap = ref(true)
  const lineNumbers = ref(true)
  const copied = ref(false)
  const copyError = ref('')
  let copyTimer: ReturnType<typeof setTimeout> | undefined
  let copyRevision = 0

  const hasContent = computed(() => !props.loading && !props.error && (!!props.text || !props.readOnly))
  const exportContent = computed(() => props.exportText ?? props.text)

  watch(exportContent, resetCopy)
  onBeforeUnmount(resetCopy)

  function resetCopy (): void {
    copyRevision++
    clearTimeout(copyTimer)
    copied.value = false
    copyError.value = ''
  }

  async function copy (): Promise<void> {
    resetCopy()
    const revision = copyRevision
    try {
      await navigator.clipboard.writeText(exportContent.value)
      if (revision !== copyRevision) return
      copied.value = true
      copyTimer = setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      if (revision === copyRevision) copyError.value = 'Unable to copy to clipboard.'
    }
  }

  function download (): void {
    if (!props.fileName) return
    downloadFile(props.fileName, new Blob([exportContent.value], { type: props.mimeType }))
  }
</script>

<style scoped>
  /* Flex items keep their content height as minimum by default, so they could not shrink below the editor */
  .code-viewer__fill {
    min-height: 0;
  }
</style>
