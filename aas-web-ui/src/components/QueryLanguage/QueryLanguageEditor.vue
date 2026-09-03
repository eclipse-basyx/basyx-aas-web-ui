<template>
  <div>
    <CodeEditor
      v-if="integration"
      v-model="queryText"
      accessible-label="AAS Query Language JSON editor"
      :error="validationMessages.length > 0"
      model-namespace="aas-query-language"
      :options="{ glyphMargin: true }"
      :schemas="integration.queryLanguageSchemas"
      @load-error="handleLoadError"
      @ready="initializeValidation"
    />

    <v-progress-linear v-else-if="validationMessages.length === 0" aria-label="Loading query editor" indeterminate />

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
      Press <v-hotkey inline keys="cmd+i" /> to open suggestions.
    </div>
  </div>
</template>

<script setup lang="ts">
  import type * as QueryIntegration from './monacoQueryLanguage'
  import type { QueryLanguageError } from './monacoQueryLanguage'
  import type { editor } from 'monaco-editor'
  import {
    createQueryLanguageValidationScheduler,
    getQueryLanguageValidationErrorMessage,
    isQueryLanguageValidationStartupError,
    type QueryLanguageValidation,
    type QueryLanguageValidationScheduler,
  } from '@/pages/modules/queryLanguage/queryLanguageValidation'

  const queryText = defineModel<string>({ required: true })
  const emit = defineEmits<{
    'validation-change': [validation: QueryLanguageValidation]
  }>()
  const integration = shallowRef<typeof QueryIntegration>()
  const validationMessages = ref<string[]>([])
  let validationScheduler: QueryLanguageValidationScheduler | undefined
  let unmounted = false

  const visibleValidationMessages = computed(() => validationMessages.value.slice(0, 3))
  const hiddenValidationMessageCount = computed(() => Math.max(0, validationMessages.value.length - 3))

  watch(queryText, invalidateValidation, { flush: 'sync', immediate: true })

  onMounted(async () => {
    try {
      const loaded = await import('./monacoQueryLanguage')
      if (!unmounted) integration.value = loaded
    } catch (error) {
      if (!unmounted) handleLoadError(error)
    }
  })
  onBeforeUnmount(() => {
    unmounted = true
    validationScheduler?.dispose()
  })

  function initializeValidation (model: editor.ITextModel): void {
    const loaded = integration.value
    if (!loaded) return
    validationScheduler = createQueryLanguageValidationScheduler({
      onError: handleValidationError,
      onResult: applyValidation,
      shouldRetry: isQueryLanguageValidationStartupError,
      validate: () => loaded.validateQueryLanguageDocument(model.uri),
    })
    validationScheduler.schedule()
  }

  function invalidateValidation (): void {
    emit('validation-change', { isValid: false, messages: validationMessages.value })
    validationScheduler?.schedule()
  }

  function applyValidation (errors: QueryLanguageError[]): void {
    validationMessages.value = errors.map(error => `Line ${error.line}, column ${error.column}: ${error.message}`)
    emit('validation-change', {
      isValid: queryText.value.trim() !== '' && errors.length === 0,
      messages: validationMessages.value,
    })
  }

  function handleLoadError (error: unknown): void {
    validationMessages.value = [`Unable to load the query editor: ${getQueryLanguageValidationErrorMessage(error)}`]
    invalidateValidation()
  }

  function handleValidationError (error: unknown): void {
    validationMessages.value = [`Unable to validate the query: ${getQueryLanguageValidationErrorMessage(error)}`]
    emit('validation-change', { isValid: false, messages: validationMessages.value })
  }
</script>
