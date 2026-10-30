<template>
  <AbacDialog
    v-model="isOpen"
    :advisory="advisory"
    :editor-mode="editorMode"
    :error="jsonError"
    :form-limitation="formLimitation"
    :loading="isPending"
    :messages="tm(`definitions.definitionDialog.${dialogMode}`)"
    @submit="onSubmit"
    @switch="switchEditorMode"
  >
    <template #form>
      <v-expansion-panels v-model="openSections" eager multiple>
        <FormGroup
          :diagnostic-keys="['name', 'kind']"
          :error="!!nameError || !!kindError"
          help-topic="details"
          :hint="t('forms.sectionHelp.details')"
          :title="t('forms.sections.details')"
          value="details"
          :warning="advisory?.paths?.some(path => ['name', 'kind'].includes(path[0] ?? ''))"
        >
          <v-select
            v-model="definitionKind"
            :aria-label="t('definitions.definitionDialog.kind')"
            v-bind="i18nData('definitions.definitionDialog.kind')"
            :aria-required="dialogMode === 'create'"
            density="comfortable"
            :disabled="dialogMode !== 'create' || isPending"
            :error-messages="kindError"
            hide-details="auto"
            item-title="title"
            item-value="value"
            :items="kindOptions"
            :label="`${t('definitions.definitionDialog.kind')}${dialogMode === 'create' ? ' *' : ''}`"
            variant="outlined"
            @update:model-value="onChangeKind"
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

          <v-text-field
            v-if="dialogMode === 'create' && definitionKind"
            id="name"
            density="comfortable"
            :error-messages="nameError"
            hide-details="auto"
            :label="`${t('definitions.definitionDialog.name')} *`"
            :model-value="createName"
            variant="outlined"
            @update:model-value="onChangeName"
          />

        </FormGroup>

        <FormGroup
          :diagnostic-exclude-keys="['name', 'kind']"
          :error="errorPaths.some(path => path.length > 0 && !['name', 'kind'].includes(path[0] ?? ''))"
          :help-topic="definitionKind ?? 'details'"
          :hint="definitionKind ? t(`forms.sectionHelp.${definitionKind}`) : t('forms.sectionHelp.details')"
          :title="definitionKind ? t(`definitions.${definitionKind}`) : t('forms.toggle.form')"
          value="content"
          :warning="advisory?.paths?.some(path => path.length === 0 || !['name', 'kind'].includes(path[0] ?? ''))"
        >
          <p v-if="dialogMode === 'update'" class="mb-0 text-body-small">
            {{ t('definitions.definitionDialog.updateHint') }}
          </p>

          <DefinitionForm
            v-if="definitionKind && formDocument"
            :doc="formDocument"
            :error-paths="errorPaths"
            :kind="definitionKind"
            :warning-paths="advisory?.paths"
            @update:doc="updateFormDocument"
          />
        </FormGroup>
      </v-expansion-panels>
    </template>

    <template #json>
      <v-select
        v-model="definitionKind"
        :aria-required="dialogMode === 'create'"
        class="mb-4"
        density="comfortable"
        :disabled="dialogMode !== 'create' || isPending"
        :error-messages="kindError"
        hide-details="auto"
        item-title="title"
        item-value="value"
        :items="kindOptions"
        :label="`${t('definitions.definitionDialog.kind')}${dialogMode === 'create' ? ' *' : ''}`"
        variant="outlined"
        @update:model-value="onChangeKind"
      />

      <v-text-field
        v-if="dialogMode !== 'create'"
        class="mb-4"
        density="comfortable"
        disabled
        hide-details
        :label="t('definitions.definitionDialog.name')"
        :model-value="definitionName"
        variant="outlined"
      />

      <p v-if="dialogMode === 'update'" class="mb-4 text-body-small">
        {{ t('definitions.definitionDialog.updateHint') }}
      </p>

      <AbacEditor
        v-model="jsonText"
        :active="editorMode === 'json'"
        :disabled="isPending"
        :label="t('definitions.definitionDialog.editor')"
        :rows="18"
        :target="{ kind: definitionKind, mode: dialogMode, viewer: 'definition' }"
      />
    </template>
  </AbacDialog>
</template>

<script setup lang="ts">
  import type { Definition, DefinitionDialogProps, DefinitionKind } from '../../types/definitions'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useCreateDefinition } from '../../api/definition/useCreateDefinition'
  import { useUpdateDefinition } from '../../api/definition/useUpdateDefinition'
  import { EMPTY_DEFINITION } from '../../constants/json'
  import { useDocumentEditor } from '../../hooks/forms/useDocumentEditor'
  import { useAbacNavigation } from '../../hooks/navigation/useAbacNavigation'
  import { useDefinitionValidation } from '../../hooks/validations/useDefinitionValidation'
  import { useLiveValidation } from '../../hooks/validations/useLiveValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { DEFINITION_KINDS } from '../../types/definitions'
  import { toSaveError } from '../../utils/api'
  import { representDefinition } from '../../utils/forms/definitions'
  import { detectDefinitionUpdate, resolveUpdateDocument } from '../../utils/update'
  import AbacEditor from '../shared/AbacEditor.vue'
  import AbacDialog from '../shared/dialog/AbacDialog.vue'
  import FormGroup from '../shared/forms/FormGroup.vue'
  import DefinitionForm from './form/DefinitionForm.vue'

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, onSelectDefinition } = useAbacNavigation()

  const { mutateAsync: createDefinition, isPending: isCreating } = useCreateDefinition()
  const { mutateAsync: updateDefinition, isPending: isUpdating } = useUpdateDefinition()

  const isPending = computed(() => isCreating.value || isUpdating.value)

  const isOpen = ref(false)
  const openSections = ref(['details', 'content'])
  const dialogMode = ref<DefinitionDialogProps['mode']>('create')
  const definitionKind = ref<DefinitionKind>()
  const definitionName = ref<string | null>(null)
  const currentDefinition = ref<Definition | undefined>(undefined)

  const {
    formDocument,
    mergeBaseDocument,
    jsonText,
    editorMode,
    formLimitation,
    updateFormDocument,
    initializeNewDocument,
    loadJsonDocument,
    switchEditorMode,
  } = useDocumentEditor({
    resolveJsonDocument: (base, draft) => {
      if (dialogMode.value !== 'update' || !definitionKind.value) return draft
      const update = detectDefinitionUpdate(base, draft, definitionKind.value)
      return resolveUpdateDocument(base, update)
    },
    checkFormSupport: document => {
      if (!definitionKind.value) return { ok: false, limitation: 'structure' }
      return representDefinition(definitionKind.value, document)
    },
  })

  const { validateJson } = useDefinitionValidation(tm('definitions.definitionDialog.errors'), tm('validation'))
  const { error: jsonError, errorPaths, advisory, saveError, validateNow } = useLiveValidation({
    enabled: () => isOpen.value,
    input: () => ({
      json: jsonText.value,
      kind: definitionKind.value,
      currentDefinition: dialogMode.value === 'update'
        ? currentDefinition.value
        : undefined,
      name: definitionName.value,
      inputMode: editorMode.value === 'form' ? 'complete' as const : 'merge' as const,
      mergeBase: mergeBaseDocument.value,
    }),
    validate: validateJson,
  })

  const kindOptions = computed(() => DEFINITION_KINDS.map(k => ({
    title: t(`definitions.${k}`),
    value: k,
  })))

  const createName = computed(() => {
    if (editorMode.value === 'form') {
      return typeof formDocument.value?.name === 'string' ? formDocument.value.name : ''
    }
    try {
      const document: unknown = JSON.parse(jsonText.value)
      return document !== null && typeof document === 'object' && 'name' in document && typeof document.name === 'string'
        ? document.name
        : ''
    } catch {
      return ''
    }
  })

  const nameError = computed(() => {
    if (saveError.value?.paths?.some(path => path.length === 1 && path[0] === 'name')) {
      return saveError.value.messages?.join('\n') ?? saveError.value.title
    }
    return errorPaths.value?.some(path => path[0] === 'name') && !hasContent(createName.value)
      ? t('definitions.definitionDialog.errors.requiredName')
      : undefined
  })
  const kindError = computed(() => errorPaths.value?.some(path => path[0] === 'kind') && !definitionKind.value
    ? t('definitions.definitionDialog.errors.requiredKind')
    : undefined)

  function onChangeKind (kind: DefinitionKind): void {
    const previousEditorMode = editorMode.value
    definitionKind.value = kind
    if (dialogMode.value === 'create') {
      initializeNewDocument(EMPTY_DEFINITION[kind])
      if (previousEditorMode === 'json') switchEditorMode('json')
    }
  }

  function onChangeName (value: string): void {
    if (formDocument.value) {
      updateFormDocument({ ...formDocument.value, name: value })
    }
  }

  function open ({ mode, definition, kind }: DefinitionDialogProps): void {
    openSections.value = ['details', 'content']
    isOpen.value = true
    dialogMode.value = mode
    definitionKind.value = kind ?? 'attributes'
    currentDefinition.value = definition

    if (mode === 'create') {
      definitionName.value = null
      initializeNewDocument(EMPTY_DEFINITION[kind ?? 'attributes'])
    } else if (definition) {
      const { name, ...rest } = definition
      definitionName.value = name
      loadJsonDocument(JSON.stringify(rest, null, 2))
    }
  }

  function close (): void {
    isOpen.value = false
  }

  async function onSubmit (): Promise<void> {
    const { payload } = validateNow()

    saveError.value = null

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
            inputMode: editorMode.value === 'form' ? 'complete' : 'merge',
            mergeBase: mergeBaseDocument.value,
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
      saveError.value = toSaveError(error, t(`definitions.error.${dialogMode.value}`))
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
