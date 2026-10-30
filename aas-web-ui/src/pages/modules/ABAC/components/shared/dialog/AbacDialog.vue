<template>
  <v-dialog
    v-model="isOpen"
    :aria-label="messages.title"
    class="abac-dialog"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 860"
    persistent
    scrollable
    :z-index="ABAC_DIALOG_Z_INDEX"
  >
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6">{{ messages.title }}</span>
        <v-spacer />

        <v-btn
          :aria-label="messages.cancel"
          density="comfortable"
          :disabled="loading"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text ref="dialogBody" class="pa-3 bg-card">
        <v-form
          :key="editorSession"
          :class="{ 'opacity-50': loading }"
          :disabled="loading"
          :inert="loading"
          @submit.prevent="submit"
        >
          <slot />

          <div v-if="$slots.form" v-show="editorMode === 'form'">
            <slot name="form" />
          </div>

          <div v-if="hasOpenedJson && $slots.json" v-show="editorMode === 'json'">
            <slot name="json" />
          </div>
        </v-form>

        <ValidationSummary v-if="advisory" advisory :error="advisory" />
        <ValidationSummary v-if="error" :error="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex flex-column align-stretch ga-2">
        <p v-if="editorMode === 'json' && formLimitation" :id="limitationId" class="text-body-small text-error ma-0" role="status">
          {{ t(`forms.limitation.${formLimitation}`) }}
        </p>

        <div class="d-flex align-center ga-2" :class="{ 'flex-column align-stretch': isMobile }">
          <v-btn-toggle
            v-if="editorMode"
            :aria-describedby="editorMode === 'json' && formLimitation ? limitationId : undefined"
            :aria-label="t('forms.toggle.ariaLabel')"
            class="form-json-toggle align-self-start"
            color="primary"
            density="comfortable"
            :disabled="loading"
            height="36"
            mandatory
            :model-value="editorMode"
            :rounded="0"
            size="small"
            variant="outlined"
            @update:model-value="switchMode"
          >
            <v-btn class="px-4" height="36" value="form">
              <v-icon :icon="ICONS.FORM" start />
              {{ t('forms.toggle.form') }}
            </v-btn>

            <v-btn class="px-4" height="36" value="json">
              <v-icon :icon="ICONS.JSON" start />
              {{ t('forms.toggle.json') }}
            </v-btn>
          </v-btn-toggle>

          <v-spacer v-if="!isMobile" />

          <div class="d-flex align-center justify-end ga-2" :class="{ 'w-100': isMobile }">
            <v-btn :disabled="loading" variant="text" @click="close">
              {{ messages.cancel }}
            </v-btn>

            <v-btn color="primary" :loading="loading" variant="text" @click="submit">
              {{ messages.submit }}
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { AbacDialogMessages } from '../../../i18n/locales'
  import type { DocumentEditorMode, FormLimitation } from '../../../types/forms'
  import type { JsonErrorMessage } from '../../../types/json'
  import { FORM_DIAGNOSTICS_KEY } from '../../../constants/inject'
  import { ABAC_DIALOG_Z_INDEX } from '../../../constants/ui'
  import { useAbacNavigation } from '../../../hooks/navigation/useAbacNavigation'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import ValidationSummary from '../forms/ValidationSummary.vue'

  const ICONS = {
    CLOSE: 'mdi-close',
    FORM: 'mdi-form-textbox',
    JSON: 'mdi-code-braces',
  } as const

  const { loading, editorMode, error, advisory, formLimitation } = defineProps<{
    messages: AbacDialogMessages
    loading?: boolean
    error?: JsonErrorMessage | null
    advisory?: JsonErrorMessage | null
    editorMode?: DocumentEditorMode
    formLimitation?: FormLimitation | null
  }>()

  const isOpen = defineModel<boolean>({ required: true })
  const emit = defineEmits<{ (e: 'submit'): void, (e: 'switch', mode: DocumentEditorMode): void }>()

  provide(FORM_DIAGNOSTICS_KEY, computed(() => ({ error, advisory })))

  const limitationId = useId()
  const { t } = useAbacI18n()
  const { isMobile } = useAbacNavigation()
  const dialogBody = useTemplateRef('dialogBody')
  const editorSession = ref(0)
  const hasOpenedJson = ref(false)
  const scrollPositions: Record<DocumentEditorMode, number> = { form: 0, json: 0 }

  // Capture the outgoing view before hiding it, then restore the incoming view after rendering.
  watch([isOpen, () => editorMode], async ([open, mode], [wasOpen, previousMode]) => {
    if (!open) return
    if (wasOpen) {
      if (previousMode) scrollPositions[previousMode] = dialogBody.value?.$el.scrollTop ?? 0
      if (mode === 'json') hasOpenedJson.value = true
    } else {
      editorSession.value++
      scrollPositions.form = 0
      scrollPositions.json = 0
      hasOpenedJson.value = mode === 'json'
    }
    await nextTick()
    if (isOpen.value && editorMode === mode && dialogBody.value) {
      dialogBody.value.$el.scrollTop = mode ? scrollPositions[mode] : 0
    }
  }, { immediate: true })

  function close (): void {
    if (!loading) isOpen.value = false
  }

  function submit (): void {
    if (!loading) emit('submit')
  }

  function switchMode (mode: unknown): void {
    if (!loading && (mode === 'form' || mode === 'json') && mode !== editorMode) {
      emit('switch', mode)
    }
  }
</script>
