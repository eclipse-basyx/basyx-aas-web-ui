<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6" v-bind="i18nData(`definitions.definitionDialog.title.${dialogMode}`)">
          {{ t(`definitions.definitionDialog.title.${dialogMode}`) }}
        </span>

        <v-spacer />

        <v-btn
          density="comfortable"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form @submit.prevent="onSubmit">
          <v-select
            v-model="definitionKind"
            class="mb-5"
            density="comfortable"
            :disabled="dialogMode !== 'create'"
            hide-details
            item-title="title"
            item-value="value"
            :items="kindOptions"
            v-bind="i18nData('definitions.definitionDialog.kind')"
            :label="t('definitions.definitionDialog.kind')"
            variant="outlined"
          />

          <v-text-field
            v-if="dialogMode !== 'create'"
            id="name"
            density="comfortable"
            disabled
            hide-details
            :label="t('definitions.definitionDialog.name')"
            :model-value="definitionName"
            variant="outlined"
          />

          <p v-if="dialogMode === 'update'" class="mb-0 text-body-small">
            {{ t('definitions.definitionDialog.updateHint') }}
          </p>

          <AbacEditor
            v-model="definitionJson"
            :disabled="isPending"
            :error-message="jsonError"
            :label="t('definitions.definitionDialog.editor')"
            :rows="18"
            :target="{ kind: definitionKind, mode: dialogMode, viewer: 'definition', }"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          v-bind="i18nData('definitions.definitionDialog.cancel')"
          @click="close"
        >
          {{ t('definitions.definitionDialog.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :loading="isPending"
          variant="flat"
          v-bind="i18nData(`definitions.definitionDialog.${dialogMode}`)"
          @click="onSubmit"
        >
          {{ t(`definitions.definitionDialog.${dialogMode}`) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { Definition, DefinitionKind } from '../../types/definitions'
  import type { JsonErrorMessage } from '../../types/json.ts'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useCreateDefinition } from '../../api/definition/useCreateDefinition'
  import { useUpdateDefinition } from '../../api/definition/useUpdateDefinition'
  import { EMPTY_DEFINITION } from '../../constants/json'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { useDefinitionValidation } from '../../hooks/useDefinitionValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { DEFINITION_KINDS } from '../../types/definitions'
  import AbacEditor from '../shared/AbacEditor.vue'

  const ICONS = {
    CLOSE: 'mdi-close',
  } as const

  export interface DefinitionDialogProps {
    mode: 'create' | 'update'
    definition?: Definition
    kind?: DefinitionKind
  }

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, onSelectDefinition } = useAbacNavigation()

  const { mutateAsync: createDefinition, isPending: isCreating } = useCreateDefinition()
  const { mutateAsync: updateDefinition, isPending: isUpdating } = useUpdateDefinition()

  const isPending = computed(() => isCreating.value || isUpdating.value)

  const isOpen = ref(false)
  const dialogMode = ref<DefinitionDialogProps['mode']>('create')
  const definitionKind = ref<DefinitionKind>()
  const definitionJson = ref('')
  const definitionName = ref<string | null>(null)
  const currentDefinition = ref<Definition | undefined>(undefined)
  const jsonError = ref<JsonErrorMessage | null>(null)

  const kindOptions = computed(() => DEFINITION_KINDS.map(k => ({
    title: t(`definitions.${k}`),
    value: k,
  })))

  watch(definitionKind, kind => {
    if (dialogMode.value !== 'create') return
    definitionJson.value = JSON.stringify(EMPTY_DEFINITION[kind || 'attributes'], null, 2)
  })

  function open ({ mode, definition, kind }: DefinitionDialogProps): void {
    isOpen.value = true
    dialogMode.value = mode
    jsonError.value = null
    definitionKind.value = kind ?? 'attributes'
    currentDefinition.value = definition

    if ((mode !== 'create') && definition) {
      const { name, ...rest } = definition
      definitionName.value = name
      // Note: name cannot be changed
      definitionJson.value = JSON.stringify(rest, null, 2)
    } else {
      definitionName.value = null
      definitionJson.value = JSON.stringify(EMPTY_DEFINITION[kind ?? 'attributes'], null, 2)
    }
  }

  function close (): void {
    isOpen.value = false
  }

  const { validateJson } = useDefinitionValidation(tm('definitions.definitionDialog.errors'), tm('validation'))

  async function onSubmit (): Promise<void> {
    const { payload, error } = validateJson({
      json: definitionJson.value,
      kind: definitionKind.value,
      currentDefinition: dialogMode.value === 'update'
        ? currentDefinition.value
        : undefined,
      name: definitionName.value,
    })

    jsonError.value = error

    if (!payload) return

    const versionId = selectedPolicyVersion.value
    const kind = definitionKind.value
    if (!hasContent(versionId) || !hasContent(kind)) return

    try {
      switch (dialogMode.value) {
        case 'create': {
          await createDefinition({
            versionId,
            kind,
            payload,
          })

          if (typeof payload.name === 'string') onSelectDefinition(payload.name, kind)
          break
        }
        case 'update': {
          const name = definitionName.value?.trim()
          if (!hasContent(name)) return
          await updateDefinition({
            versionId,
            kind,
            name,
            currentDefinition: currentDefinition.value!,
            payload,
          })
          break
        }
      }

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 3000,
        color: 'success',
        btnColor: 'buttonText',
        text: t(`definitions.success.${dialogMode.value}`),
      })

      close()
    } catch (error) {
      // Replace validation errors with the save failure.
      jsonError.value = {
        title: t(`definitions.error.${dialogMode.value}`),
        messages: error instanceof Error ? error.message.split('\n') : undefined,
      }
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t(`definitions.error.${dialogMode.value}`),
      })
    }
  }

  defineExpose({ open, close })
</script>
