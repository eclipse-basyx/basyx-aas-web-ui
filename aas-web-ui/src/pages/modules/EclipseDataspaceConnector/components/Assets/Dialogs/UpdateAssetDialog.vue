<template>
  <v-dialog
    v-model="updateAssetDialog"
    style="min-height: 190px; max-height:90%; min-width: 800px; max-width: 90%"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader d-flex align-center">
        Update Asset
        <v-spacer />

        <v-tooltip location="bottom" open-delay="600">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              density="compact"
              :icon="wordWrap ? 'mdi-wrap-disabled' : 'mdi-wrap'"
              variant="plain"
              @click="wordWrap = !wordWrap"
            />
          </template>

          <span>{{ wordWrap ? 'Disable word wrap' : 'Enable word wrap' }}</span>
        </v-tooltip>
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 pa-0" style="display: flex; flex-direction: column; min-height: 0">

        <!-- Error banner -->
        <v-alert
          v-if="jsonError"
          class="ma-2 mb-0"
          density="compact"
          :text="jsonError"
          type="error"
          variant="tonal"
        />

        <!-- Code editor -->
        <div class="editor-container" :class="{ 'editor-error': !!jsonError }">
          <!-- Line numbers -->
          <div ref="lineNumbersRef" class="line-numbers" @scroll.passive="syncScroll">
            <div
              v-for="(height, idx) in lineHeights"
              :key="idx"
              :style="{ height: height + 'px' }"
            >
              {{ idx + 1 }}
            </div>
          </div>

          <!-- Hidden single-line measurer (word-wrap mode only) -->
          <div v-if="wordWrap" ref="measurerRef" aria-hidden="true" class="line-measurer" />

          <!-- Editable content: do NOT bind content via template — Vue must never
               overwrite textContent of a contenteditable element or the caret resets. -->
          <pre
            ref="editorRef"
            class="editor-content"
            :class="{ 'word-wrap': wordWrap }"
            contenteditable="true"
            spellcheck="false"
            @input="onEditorInput"
            @scroll.passive="syncLineNumbers"
          />
        </div>

      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="updateAssetDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!!jsonError || !jsonText.trim()"
          rounded="lg"
          text="Update"
          variant="flat"
          @click="updateAsset"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { nextTick } from 'vue'
  import { type Asset, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import { formatJSON } from '@/utils/JsonUtils'

  const props = defineProps<{
    modelValue: boolean
    asset: any
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'asset-updated'): void
  }>()

  // Composables
  const { updateAsset: updateAssetInEdc } = useEdcClient()

  // Data
  const updateAssetDialog = ref(false)
  const wordWrap = ref(false)
  const jsonText = ref('')
  const jsonError = ref<string | null>(null)
  const editorRef = ref<HTMLElement | null>(null)
  const lineNumbersRef = ref<HTMLElement | null>(null)
  const measurerRef = ref<HTMLElement | null>(null)
  const lineHeights = ref<number[]>([])

  const LINE_HEIGHT = 21

  // Computed
  const assetId = computed(() => props.asset?.['@id'] ?? '')

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      updateAssetDialog.value = value
      if (value) {
        initFromAsset()
      }
    },
  )

  watch(
    () => updateAssetDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  watch(
    () => wordWrap.value,
    () => nextTick(() => recalcLineHeights()),
  )

  watch(
    () => jsonText.value,
    () => nextTick(() => recalcLineHeights()),
  )

  // Methods
  function initFromAsset (): void {
    if (!props.asset) return
    jsonError.value = null
    try {
      jsonText.value = formatJSON(JSON.stringify(props.asset))
    } catch {
      jsonText.value = JSON.stringify(props.asset, null, 2)
    }
    // Sync DOM content after Vue updates the template
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.textContent = jsonText.value
      }
      recalcLineHeights()
    })
  }

  function recalcLineHeights (): void {
    const lines = jsonText.value.split('\n')

    if (!wordWrap.value || !measurerRef.value) {
      // Simple case: every line is exactly one row
      lineHeights.value = lines.map(() => LINE_HEIGHT)
      return
    }

    const measurer = measurerRef.value
    const heights: number[] = []

    for (const line of lines) {
      measurer.textContent = line || '\u00A0' // non-breaking space keeps empty lines measurable
      heights.push(measurer.offsetHeight)
    }

    lineHeights.value = heights
  }

  function onEditorInput (): void {
    const value = editorRef.value?.textContent ?? ''
    jsonText.value = value

    try {
      JSON.parse(value)
      jsonError.value = null
    } catch (error_) {
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }

    // Recalc line heights only — the browser keeps the caret intact because
    // we never touch editorRef.value.textContent here.
    nextTick(() => recalcLineHeights())
  }

  function syncScroll (): void {
    if (lineNumbersRef.value && editorRef.value) {
      editorRef.value.scrollTop = lineNumbersRef.value.scrollTop
    }
  }

  function syncLineNumbers (): void {
    if (lineNumbersRef.value && editorRef.value) {
      lineNumbersRef.value.scrollTop = editorRef.value.scrollTop
    }
  }

  async function updateAsset (): Promise<void> {
    if (jsonError.value || !jsonText.value.trim()) return

    const id = assetId.value
    if (!id) return

    try {
      const assetToUpdate = JSON.parse(jsonText.value) as Asset

      const success = await updateAssetInEdc(id, assetToUpdate)
      if (success) {
        emit('asset-updated')
        updateAssetDialog.value = false
      } else {
        console.error('Failed to update asset')
      }
    } catch (error_) {
      console.error('Error updating asset:', error_)
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  }
</script>

<style scoped>
    .editor-container {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        min-height: 300px;
        overflow: hidden;
        font-family: monospace;
        font-size: 13px;
        line-height: 21px;
        border: 1px solid rgba(0, 0, 0, 0.38);
        border-radius: 4px;
        margin: 8px;
    }

    .editor-error {
        border-color: rgb(var(--v-theme-error));
    }

    .line-numbers {
        padding: 8px 8px;
        text-align: right;
        background-color: #e0e0e0;
        border-right: 1px solid #ccc;
        color: #666;
        user-select: none;
        min-width: 40px;
        overflow: hidden;
        flex-shrink: 0;
    }

    .line-numbers > div {
        height: 21px;
        line-height: 21px;
        display: flex;
        align-items: flex-start;
        padding-top: 0;
    }

    .editor-content {
        flex: 1 1 auto;
        margin: 0;
        padding: 8px 16px;
        white-space: pre;
        word-wrap: normal;
        overflow: auto;
        outline: none;
        background: transparent;
        color: inherit;
        caret-color: currentColor;
    }

    .editor-content.word-wrap {
        white-space: pre-wrap;
        word-break: break-all;
        overflow-x: hidden;
    }

    /* invisible single-line box used to measure wrapped line heights */
    .line-measurer {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        white-space: pre-wrap;
        word-break: break-all;
        font-family: monospace;
        font-size: 13px;
        line-height: 21px;
        padding: 0;
        margin: 0;
        /* must match editor-content width (editor minus line-numbers sidebar) */
        left: 48px;
        right: 0;
    }
</style>
