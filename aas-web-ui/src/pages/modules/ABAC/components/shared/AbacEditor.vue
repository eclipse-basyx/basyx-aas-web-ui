<template>
  <div class="d-flex flex-column abac-editor" :class="{ 'abac-editor--borderless': borderless, 'flex-1-1': rows === 'auto' }">
    <span v-if="hasContent(label)" class="pa-4 pb-2 text-body-small" :class="{ 'text-error': isError }">
      {{ label }}
    </span>

    <CodeEditor
      v-if="schema"
      :key="schema.uri"
      v-model="model"
      :accessible-label="accessibleLabel"
      class="position-relative"
      :class="{ 'flex-1-1': rows === 'auto' }"
      :error="isError"
      :height="editorHeight"
      :model-namespace="namespace"
      :options=" {
        stickyScroll: { enabled: false },
        scrollbar: {
          horizontalScrollbarSize: 4,
          verticalScrollbarSize: 4,
        },
      }"
      :read-only="isReadOnly"
      :schemas="[schema]"
      @ready="handleReady"
    >
      <template #loading>
        <div class="position-absolute top-0 bottom-0 left-0 right-0 d-flex align-center justify-center pa-4">
          <v-progress-circular :aria-label="t('shared.editorLoading')" indeterminate />
        </div>
      </template>
    </CodeEditor>

    <div v-if="errorMessage" class="text-error pa-4 text-body-small">
      <span>{{ errorMessage.title }}</span>

      <ul v-if="hasItems(errorMessage.messages)">
        <li v-for="(message, index) in errorMessage.messages" :key="index">{{ message }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { JsonErrorMessage } from '../../types/json'
  import type { CodeSchema } from '@/components/Code/codeSchema'
  import type { AccessRulesEditorTarget } from '@/schemas/access-rules/validation/accessRulesEditorSchema'
  import type { editor } from 'monaco-editor'
  import { createAccessRulesEditorSchema, getAccessRulesEditorNamespace } from '@/schemas/access-rules/validation/accessRulesEditorSchema'
  import { hasItems } from '@/utils/array'
  import { hasContent } from '@/utils/StringUtils'
  import { useAbacI18n } from '../../i18n/useAbacI18n'

  const {
    target,
    label = '',
    errorMessage = null,
    rows = 'auto',
    disabled = false,
    borderless = false,
  } = defineProps<{
    target: AccessRulesEditorTarget
    label?: string
    errorMessage?: JsonErrorMessage | null
    /** Number of visible rows, or 'auto' to fill available height. */
    rows?: number | 'auto'
    /** Temporarily locks create/update editors; view mode is always read-only. */
    disabled?: boolean
    borderless?: boolean
  }>()

  const model = defineModel<string>({ required: true })
  const { t } = useAbacI18n()

  const schema = computed<CodeSchema | undefined>(() => {
    if (target.viewer === 'definition' && !target.kind) {
      return undefined
    }
    return createAccessRulesEditorSchema(target)
  })

  const namespace = computed(() => getAccessRulesEditorNamespace(target))
  const accessibleLabel = computed(() => label || t('shared.editorLabel'))
  const isReadOnly = computed(() => target.mode === 'view' || disabled)
  const isError = computed(() => !!errorMessage)
  const editorHeight = computed(() => rows === 'auto' ? '100%' : `${rows * 20 + 16}px`)

  function handleReady (_model: editor.ITextModel, instance: editor.IStandaloneCodeEditor): void {
    // Empty readOnlyMessage options still create a popup. Disable only the
    // notification contribution; Monaco continues enforcing read-only mode.
    instance.getContribution('editor.contrib.readOnlyMessageController')?.dispose()
  }
</script>

<style scoped>
  .abac-editor { min-height: 0; min-width: 0; }

  .abac-editor :deep(.code-editor) {
    border-radius: 4px;
  }

  .abac-editor--borderless :deep(.code-editor) {
    border: none;
    border-radius: 0;
  }

</style>
