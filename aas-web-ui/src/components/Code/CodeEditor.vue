<template>
  <div>
    <div
      ref="container"
      class="code-editor rounded border"
      :class="{ 'code-editor--error': error }"
      :style="{ height }"
    />

    <v-progress-linear v-if="loading" :aria-label="`Loading ${accessibleLabel}`" indeterminate />

    <v-alert
      v-if="loadError"
      class="mt-2"
      role="alert"
      type="error"
      variant="tonal"
    >
      {{ loadError }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
  import type { CodeSchema } from './codeSchema'
  import type * as MonacoRuntime from './monacoRuntime'
  import type { editor, IDisposable } from 'monaco-editor'
  import { v4 as uuidv4 } from 'uuid'
  import { useTheme } from 'vuetify'

  const props = withDefaults(defineProps<{
    language?: 'json' | 'xml' | 'plaintext'
    readOnly?: boolean
    accessibleLabel: string
    height?: string
    error?: boolean
    modelNamespace?: string
    schemas?: CodeSchema[]
    options?: editor.IStandaloneEditorConstructionOptions
  }>(), {
    language: 'json',
    readOnly: false,
    height: '400px',
    modelNamespace: 'code-viewer',
    schemas: () => [],
    options: () => ({}),
  })
  const value = defineModel<string>({ required: true })
  const emit = defineEmits<{
    'ready': [model: editor.ITextModel]
    'content-change': [value: string]
    'load-error': [error: unknown]
  }>()

  const container = ref<HTMLElement>()
  const loading = ref(true)
  const loadError = ref('')
  const theme = useTheme()
  let runtime: typeof MonacoRuntime | undefined
  let instance: editor.IStandaloneCodeEditor | undefined
  let model: editor.ITextModel | undefined
  let subscription: IDisposable | undefined
  let unmounted = false
  let applyingExternalValue = false

  const editorOptions = computed<editor.IStandaloneEditorConstructionOptions>(() => ({
    automaticLayout: true,
    fixedOverflowWidgets: true,
    folding: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 2,
    formatOnPaste: !props.readOnly,
    formatOnType: !props.readOnly,
    quickSuggestions: { comments: false, other: true, strings: true },
    wordBasedSuggestions: 'off',
    ...props.options,
    ariaLabel: props.accessibleLabel,
    readOnly: props.readOnly,
    domReadOnly: props.readOnly,
    renderValidationDecorations: props.readOnly ? 'off' : 'on',
    theme: theme.global.current.value.dark ? 'vs-dark' : 'vs',
  }))

  watch(value, text => {
    if (!model || text === model.getValue()) return
    applyingExternalValue = true
    try {
      model.setValue(text)
    } finally {
      applyingExternalValue = false
    }
  }, { flush: 'sync' })
  watch(editorOptions, options => instance?.updateOptions(options), { deep: true })
  watch(() => props.language, language => {
    if (model) runtime?.monaco.editor.setModelLanguage(model, language)
  })
  watch(() => props.schemas, schemas => runtime?.configureJsonDiagnostics(schemas))

  onMounted(async () => {
    try {
      runtime = await import('./monacoRuntime')
      if (unmounted || !container.value) return
      runtime.configureJsonDiagnostics(props.schemas)
      const { monaco } = runtime
      const uri = monaco.Uri.parse(`inmemory://${props.modelNamespace}/${uuidv4()}.${props.language}`)
      model = monaco.editor.createModel(value.value, props.language, uri)
      instance = monaco.editor.create(container.value, { ...editorOptions.value, model })
      subscription = model.onDidChangeContent(() => {
        if (!model) return
        const text = model.getValue()
        emit('content-change', text)
        if (!applyingExternalValue) value.value = text
      })
      emit('ready', model)
    } catch (error) {
      disposeEditor()
      if (unmounted) return
      loadError.value = `Unable to load the code editor: ${error instanceof Error ? error.message : String(error)}`
      emit('load-error', error)
    } finally {
      if (!unmounted) loading.value = false
    }
  })

  onBeforeUnmount(() => {
    unmounted = true
    disposeEditor()
  })

  function disposeEditor (): void {
    subscription?.dispose()
    instance?.dispose()
    model?.dispose()
    subscription = undefined
    instance = undefined
    model = undefined
  }

  function find (): void {
    instance?.focus()
    void instance?.getAction('actions.find')?.run()
  }

  function suggest (): void {
    instance?.focus()
    void instance?.getAction('editor.action.triggerSuggest')?.run()
  }

  defineExpose({ find, suggest })
</script>

<style scoped>
  /* Monaco positions overflow widgets against the viewport. Vuetify's layout
     containment creates a different fixed-position origin inside dialogs. */
  :global(.v-overlay__content:has(.code-editor)) {
    contain: none;
  }

  .code-editor {
    min-width: 0;
    overflow: hidden;
  }

  .code-editor--error {
    border-color: rgb(var(--v-theme-error)) !important;
  }
</style>
