<script setup lang="ts">
  import type { JsonErrorMessage } from '../shared/JsonCodeEditor.vue'
  import type { DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
  import { computed, ref, watch } from 'vue'
  import { useCreateDefinition } from '@/pages/modules/ABAC/api/queries/definition/useCreateDefinition'
  import { usePatchDefinition } from '@/pages/modules/ABAC/api/queries/definition/usePatchDefinition'
  import { useReplaceDefinition } from '@/pages/modules/ABAC/api/queries/definition/useReplaceDefinition'
  import { DEFINITION_KINDS } from '@/pages/modules/ABAC/types/definitions'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { EMPTY_DEFINITION } from '../../constants/json'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { useDefinitions } from '../../hooks/useDefinitions'
  import { useDefinitionValidation } from '../../hooks/useDefinitionValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import JsonCodeEditor from '../shared/JsonCodeEditor.vue'

  const ICONS = {
    CLOSE: 'mdi-close',
  } as const

  export type DefinitionDialogMode = 'create' | 'replace' | 'patch'

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, selectedDefinitionKind, onSelectDefinition } = useAbacNavigation()
  const { selectedDefinition } = useDefinitions()

  const { mutateAsync: createDefinition, isPending: isCreating } = useCreateDefinition()
  const { mutateAsync: replaceDefinition, isPending: isReplacing } = useReplaceDefinition()
  const { mutateAsync: patchDefinition, isPending: isPatching } = usePatchDefinition()

  const isPending = computed(() => isCreating.value || isReplacing.value || isPatching.value)

  const isOpen = ref(false)
  const dialogMode = ref<DefinitionDialogMode>('create')
  const definitionKind = ref<DefinitionKind>()
  const definitionJson = ref('')
  const definitionName = ref<string | null>(null)
  const jsonError = ref<JsonErrorMessage | null>(null)
  const errorLines = ref<number[]>([])

  const kindOptions = computed(() => DEFINITION_KINDS.map(k => ({
    title: t(`definitions.${k}`),
    value: k,
  })))

  watch(definitionKind, kind => {
    if (dialogMode.value !== 'create') return
    definitionJson.value = JSON.stringify(EMPTY_DEFINITION[kind || 'attributes'], null, 2)
  })

  function open (mode: DefinitionDialogMode): void {
    isOpen.value = true
    dialogMode.value = mode
    jsonError.value = null
    errorLines.value = []
    definitionKind.value = selectedDefinitionKind.value || 'attributes'
    definitionName.value = null

    if ((mode !== 'create') && selectedDefinition.value && selectedDefinitionKind.value) {
      const { name, ...rest } = selectedDefinition.value
      definitionName.value = name
      // Note: name cannot be changed
      definitionJson.value = JSON.stringify(rest, null, 2)
    } else {
      definitionJson.value = JSON.stringify(EMPTY_DEFINITION[selectedDefinitionKind.value || 'attributes'], null, 2)
    }
  }

  function close (): void {
    isOpen.value = false
  }

  const { validateJson } = useDefinitionValidation(tm('validation'))

  async function onSubmit (): Promise<void> {
    const { payload, error, errorLines: lines } = validateJson({
      json: definitionJson.value,
      kind: definitionKind.value,
      currentDefinition: dialogMode.value === 'patch' ? selectedDefinition.value : undefined,
      name: definitionName.value,
      errorMessages: {
        requiredKind: t('definitions.definitionDialog.requiredKind'),
        requiredDefinition: t('definitions.definitionDialog.requiredDefinition'),
        invalidJson: t('definitions.definitionDialog.invalidJson'),
        invalidDefinition: t('definitions.definitionDialog.invalidDefinition'),
      },
    })

    jsonError.value = error
    errorLines.value = lines

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

          onSelectDefinition(payload.name, kind)
          break
        }
        case 'patch': {
          await patchDefinition({
            versionId,
            kind,
            name: payload.name.trim(),
            patch: payload,
          })
          break
        }
        case 'replace': {
          await replaceDefinition({
            versionId,
            kind,
            name: payload.name.trim(),
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
      const message = error instanceof Error ? error.message : t(`definitions.error.${dialogMode.value}`)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: message,
      })
    }
  }

  defineExpose({ open, close })
</script>

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
        <v-form ref="form" @submit.prevent="onSubmit">
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

          <p v-if="dialogMode === 'patch'" class="text-end mb-0 text-body-small">
            {{ t('definitions.definitionDialog.patchHint') }}
          </p>

          <JsonCodeEditor
            v-model="definitionJson"
            :disabled="isPending"
            :error-lines="errorLines"
            :error-message="jsonError"
            :label="t('definitions.definitionDialog.editor')"
            :rows="18"
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
