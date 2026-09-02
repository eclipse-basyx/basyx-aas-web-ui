<template>
  <div>
    <div
      ref="editorContainer"
      class="query-language-editor"
      :class="{ 'query-language-editor--error': validationMessages.length > 0 }"
    />

    <v-progress-linear
      v-if="isLoading"
      color="primary"
      indeterminate
    />

    <v-alert
      v-if="validationMessages.length > 0"
      class="mt-2"
      density="compact"
      icon="mdi-alert-circle-outline"
      role="alert"
      type="error"
      variant="tonal"
    >
      <div v-for="message in visibleValidationMessages" :key="message">
        {{ message }}
      </div>

      <div v-if="hiddenValidationMessageCount > 0">
        {{ hiddenValidationMessageCount }} more validation
        {{ hiddenValidationMessageCount === 1 ? 'error' : 'errors' }}
      </div>
    </v-alert>

    <div class="mt-1 text-caption text-medium-emphasis">
      Suggestions and validation are provided by the AAS Query Language JSON Schema.
      Press Ctrl+Space to open suggestions.
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { QueryLanguageError } from './monacoQueryLanguage'
  import type { editor, IDisposable } from 'monaco-editor'
  import { useTheme } from 'vuetify'
  import {
    createQueryLanguageValidationScheduler,
    type QueryLanguageValidation,
    type QueryLanguageValidationScheduler,
  } from '@/pages/modules/queryLanguage/queryLanguageValidation'

  const queryText = defineModel<string>({ required: true })

  const emit = defineEmits<{
    'validation-change': [validation: QueryLanguageValidation]
  }>()

  const editorContainer = ref<HTMLElement>()
  const validationMessages = ref<string[]>([])
  const isLoading = ref(true)
  const theme = useTheme()

  const visibleValidationMessages = computed(() => validationMessages.value.slice(0, 3))
  const hiddenValidationMessageCount = computed(() => Math.max(0, validationMessages.value.length - 3))
  const isDark = computed(() => theme.global.current.value.dark)

  let queryEditor: editor.IStandaloneCodeEditor | undefined
  let queryModel: editor.ITextModel | undefined
  let contentSubscription: IDisposable | undefined
  let validationScheduler: QueryLanguageValidationScheduler | undefined
  let isApplyingExternalValue = false
  let isUnmounted = false

  watch(queryText, value => {
    if (!queryModel || value === queryModel.getValue()) return

    isApplyingExternalValue = true
    queryModel.setValue(value)
    isApplyingExternalValue = false
  })

  watch(isDark, dark => {
    queryEditor?.updateOptions({ theme: dark ? 'vs-dark' : 'vs' })
  })

  onMounted(async () => {
    emit('validation-change', {
      isValid: false,
      messages: [],
    })

    try {
      const integration = await import('./monacoQueryLanguage')
      if (!editorContainer.value || isUnmounted) return

      const monaco = integration.monaco

      const modelUri = monaco.Uri.parse(`inmemory://aas-query-language/query-${Date.now()}.json`)

      integration.configureQueryLanguageDiagnostics(modelUri.toString())

      queryModel = monaco.editor.createModel(queryText.value, 'json', modelUri)
      queryEditor = monaco.editor.create(editorContainer.value, {
        ariaLabel: 'AAS Query Language JSON editor',
        automaticLayout: true,
        fixedOverflowWidgets: true,
        folding: true,
        formatOnPaste: true,
        formatOnType: true,
        glyphMargin: true,
        lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.On },
        minimap: { enabled: false },
        model: queryModel,
        quickSuggestions: {
          comments: false,
          other: true,
          strings: true,
        },
        renderValidationDecorations: 'on',
        scrollBeyondLastLine: false,
        suggestOnTriggerCharacters: true,
        tabSize: 2,
        theme: isDark.value ? 'vs-dark' : 'vs',
        wordBasedSuggestions: 'off',
      })

      validationScheduler = createQueryLanguageValidationScheduler({
        onError: handleValidationError,
        onResult: applyValidation,
        validate: () => integration.validateQueryLanguageDocument(modelUri),
      })

      contentSubscription = queryModel.onDidChangeContent(() => {
        if (!queryModel) return

        emit('validation-change', {
          isValid: false,
          messages: validationMessages.value,
        })
        validationScheduler?.schedule()

        if (!isApplyingExternalValue) queryText.value = queryModel.getValue()
      })

      validationScheduler.schedule(0)
    } catch (error) {
      validationMessages.value = [
        `Unable to load the query editor: ${(error as Error).message}`,
      ]
      emit('validation-change', {
        isValid: false,
        messages: validationMessages.value,
      })
    } finally {
      isLoading.value = false
    }
  })

  onBeforeUnmount(() => {
    isUnmounted = true
    contentSubscription?.dispose()
    validationScheduler?.dispose()
    queryEditor?.dispose()
    queryModel?.dispose()
  })

  function applyValidation (errors: QueryLanguageError[]): void {
    validationMessages.value = errors.map(error =>
      `Line ${error.line}, column ${error.column}: ${error.message}`,
    )

    emit('validation-change', {
      isValid: queryModel?.getValue().trim() !== '' && errors.length === 0,
      messages: validationMessages.value,
    })
  }

  function handleValidationError (error: unknown): void {
    validationMessages.value = [`Unable to validate the query: ${(error as Error).message}`]
    emit('validation-change', {
      isValid: false,
      messages: validationMessages.value,
    })
  }
</script>

<style scoped>
  .query-language-editor {
    border: 1px solid rgb(var(--v-theme-outline));
    border-radius: 4px;
    height: 400px;
    overflow: hidden;
  }

  .query-language-editor--error {
    border-color: rgb(var(--v-theme-error));
  }
</style>
