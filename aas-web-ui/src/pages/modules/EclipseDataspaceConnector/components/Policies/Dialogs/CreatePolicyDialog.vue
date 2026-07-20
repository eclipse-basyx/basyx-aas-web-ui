<template>
  <v-dialog
    v-model="createPolicyDialog
    "
    style="min-height: 190px; max-height:90%"
    width="800px"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader d-flex align-center">
        Create Policy

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

        <v-btn
          v-tooltip="'Open Catena-X Policy Builder'"
          color="text-medium-emphasis"
          href="https://eclipse-tractusx.github.io/tractusx-edc-dashboard/policy-builder/"
          icon
          rel="noopener noreferrer"
          size="small"
          target="_blank"
          variant="text"
        >
          <v-icon icon="mdi-information-outline" />
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column gap-4">

          <!-- Policy Type Selection -->
          <v-select
            v-model="selectedType"
            dense
            :hint="selectedPolicyTypeDescription"
            item-title="name"
            item-value="value"
            :items="policyTypes"
            label="Select Policy Type"
            persistent-hint
            required
            variant="outlined"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon class="mr-n5">mdi-shield-check-outline</v-icon>
                </template>

                <template #title>
                  <span class="font-weight-bold">{{ item.name }}</span>
                </template>

                <template #subtitle>
                  {{ item.description }}
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Dynamic Placeholder Fields -->
          <div class="d-flex flex-column gap-3 pt-2">
            <v-text-field
              v-for="(placeholder, index) in placeholders"
              :key="placeholder.label"
              v-model="placeholderValues[placeholder.label]"
              :class="index > 0 ? 'mt-2': ''"
              dense
              :hide-details="placeholder.hint == ''"
              :hint="placeholder.hint"
              :label="placeholder.label"
              :persistent-hint="placeholder.hint !== ''"
              :placeholder="placeholder.placeholder"
              required
              variant="outlined"
            />
          </div>

          <!-- Policy Preview -->
          <div>
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">
              Policy Preview:
            </p>

            <!-- Error banner -->
            <v-alert
              v-if="jsonError"
              class="mb-2"
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
                @keydown="onEditorKeydown"
                @scroll.passive="syncLineNumbers"
              />
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="createPolicyDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!allPlaceholdersFilled() || !!jsonError || !jsonText.trim()"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createPolicy"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { nextTick } from 'vue'
  import { type PolicyDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import Policy_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/policy___tractus-x_edc_v0.12.1.json'
  import { formatJSON } from '@/utils/JsonUtils'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'policy-created', policyId: string): void
  }>()

  // Composables
  const { createPolicyDefinition: createPolicyDefinitionInEdc } = useEdcClient()

  // Data
  const createPolicyDialog = ref(false)
  const selectedType = ref<'access' | 'usage'>('usage')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const wordWrap = ref(false)
  const jsonText = ref('')
  const jsonError = ref<string | null>(null)
  const editorRef = ref<HTMLElement | null>(null)
  const lineNumbersRef = ref<HTMLElement | null>(null)
  const measurerRef = ref<HTMLElement | null>(null)
  const lineHeights = ref<number[]>([])

  const LINE_HEIGHT = 21

  // Computed properties
  const policyTypes = computed(() => [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Determines whether a particular consumer is offered an asset or not.',
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Determines the conditions for initiating a contract negotiation for a particular asset.',
    },
  ])

  const selectedPolicyTypeDescription = computed(() => {
    return policyTypes.value.find(policyType => policyType.value === selectedType.value)?.description || ''
  })

  const placeholders = computed(() => {
    const policyStr = JSON.stringify(Policy_v0_12_1)
    const matches = policyStr.match(/\{\{([^}]+)\}\}/g) || []

    const placeholderList = matches.map(match => {
      const content = match.slice(2, -2) // Remove {{ and }}
      const parts = content.split('|')

      return {
        label: parts[0].trim(),
        placeholder: parts[1]?.trim() || parts[0].trim(),
        hint: parts[2]?.trim() || `Enter ${parts[0].trim()}`,
      }
    })

    // Return unique placeholders by name
    const seen = new Set<string>()
    return placeholderList.filter(p => {
      if (seen.has(p.label)) return false
      seen.add(p.label)
      return true
    })
  })

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createPolicyDialog.value = value
      if (value) {
        refreshPreview()
      } else {
        resetForm()
      }
    },
  )

  watch(
    () => createPolicyDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  watch(
    () => selectedType.value,
    () => refreshPreview(),
  )

  watch(
    placeholderValues,
    () => refreshPreview(),
    { deep: true },
  )

  watch(
    () => wordWrap.value,
    () => nextTick(() => recalcLineHeights()),
  )

  // Methods
  function resetForm (): void {
    placeholderValues.value = {}
    jsonText.value = ''
    jsonError.value = null
    if (form.value) {
      form.value.reset()
    }
  }

  function allPlaceholdersFilled (): boolean {
    return placeholders.value.every(placeholder => placeholderValues.value[placeholder.label])
  }

  function replacePlaceholders (policyJson: string): string {
    let result = policyJson
    for (const placeholder of placeholders.value) {
      const value = placeholderValues.value[placeholder.label] || `{{${placeholder.label}}}`
      result = result.replace(
        /\{\{[^}]*\}\}/g,
        match => {
          const matchContent = match.slice(2, -2)
          const matchParts = matchContent.split('|')
          if (matchParts[0].trim() === placeholder.label) {
            return value
          }
          return match
        },
      )
    }
    return result
  }

  function buildPolicy (): PolicyDefinition {
    let policyJson = JSON.stringify(Policy_v0_12_1)
    policyJson = replacePlaceholders(policyJson)

    const policy = JSON.parse(policyJson) as PolicyDefinition

    if (policy.policy) {
      if (selectedType.value === 'access') {
        (policy.policy as any).permission = [
          {
            action: 'access',
            constraint: [],
          },
        ]
      } else if (selectedType.value === 'usage') {
        (policy.policy as any).permission = [
          {
            action: 'use',
            constraint: [],
          },
        ]
      }
    }

    return policy
  }

  function refreshPreview (): void {
    try {
      const policy = buildPolicy()
      jsonText.value = formatJSON(JSON.stringify(policy))
      jsonError.value = null
    } catch (error_) {
      jsonText.value = JSON.stringify(Policy_v0_12_1, null, 2)
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
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

  function onEditorKeydown (event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    // Insert spaces instead of moving focus to the next element
    event.preventDefault()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const tabSpaces = '  '
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const textNode = document.createTextNode(tabSpaces)
    range.insertNode(textNode)

    // Move caret to the end of the inserted spaces
    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    selection.removeAllRanges()
    selection.addRange(range)

    onEditorInput()
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

  async function createPolicy (): Promise<void> {
    if (jsonError.value || !jsonText.value.trim()) return

    try {
      const finalPolicy = JSON.parse(jsonText.value) as PolicyDefinition

      // Create the policy via EDC API
      const response = await createPolicyDefinitionInEdc(finalPolicy)
      if (response) {
        emit('policy-created', response['@id'])
        createPolicyDialog.value = false
        resetForm()
      } else {
        console.error('Failed to create policy')
      }
    } catch (error_) {
      console.error('Error creating policy:', error_)
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  }

</script>

<style scoped>
    .editor-container {
        position: relative;
        display: flex;
        min-height: 200px;
        max-height: 400px;
        overflow: hidden;
        font-family: monospace;
        font-size: 13px;
        line-height: 21px;
        border: 1px solid rgba(0, 0, 0, 0.38);
        border-radius: 4px;
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
        left: 48px;
        right: 0;
    }
</style>
