<template>
  <div class="d-flex flex-column ga-4">
    <template v-if="kind === 'attributes'">
      <AttributeListEditor
        :aria-label="t('forms.attributes.entries')"
        :error-paths="errorPaths?.filter(path => path[0] === 'attributes').map(path => path.slice(1))"
        :model-value="attributesState.entries"
        :warning-paths="warningPaths?.filter(path => path[0] === 'attributes').map(path => path.slice(1))"
        @update:model-value="onEntryUpdate"
      />

      <v-divider />

      <v-combobox
        v-bind="diagnosticFieldProps(errorPaths ?? [], warningPaths ?? [], t, 'USEATTRIBUTES')"
        chips
        closable-chips
        density="comfortable"
        hide-details="auto"
        :hint="!diagnosticSeverity(errorPaths ?? [], warningPaths ?? [], 'USEATTRIBUTES') && attributesState.entries.length === 0 && attributesState.references.length === 0 ? t('forms.attributes.empty') : undefined"
        :items="attributeNames"
        :label="t('forms.attributes.references')"
        :model-value="attributesState.references"
        multiple
        :persistent-hint="!diagnosticSeverity(errorPaths ?? [], warningPaths ?? [], 'USEATTRIBUTES')"
        variant="outlined"
        @update:model-value="onReferencesUpdate"
      />

    </template>

    <AclForm
      v-else-if="kind === 'acls'"
      :error-paths="errorPaths?.filter(path => path[0] === 'acl').map(path => path.slice(1))"
      :model-value="aclsState"
      :warning-paths="warningPaths?.filter(path => path[0] === 'acl').map(path => path.slice(1))"
      @update:model-value="onAclUpdate"
    />

    <template v-else-if="kind === 'objects'">
      <div>
        <ObjectListEditor
          :error-paths="errorPaths?.filter(path => path[0] === 'objects').map(path => path.slice(1))"
          :model-value="objectsState.entries"
          :warning-paths="warningPaths?.filter(path => path[0] === 'objects').map(path => path.slice(1))"
          @update:model-value="onObjectEntriesUpdate"
        />
      </div>

      <v-divider />

      <v-combobox
        chips
        closable-chips
        density="comfortable"
        hide-details="auto"
        :items="objectNames"
        :label="t('forms.objects.references')"
        :model-value="objectsState.references"
        v-bind="diagnosticFieldProps(errorPaths ?? [], warningPaths ?? [], t, 'USEOBJECTS')"
        multiple
        variant="outlined"
        @update:model-value="onObjectReferencesUpdate"
      />
    </template>

    <FormulaEditor
      v-else
      :error-paths="errorPaths?.filter(path => path[0] === 'formula').map(path => path.slice(1))"
      :model-value="expressionState ?? defaultExpression"
      :warning-paths="warningPaths?.filter(path => path[0] === 'formula').map(path => path.slice(1))"
      @update:model-value="onExpressionUpdate"
    />
  </div>
</template>

<script setup lang="ts">
  import type { DefinitionKind } from '../../../types/definitions'
  import type { AclState, AttributesDefinitionState, AttributeSourceState, DefinitionFormState, ExpressionState, ObjectItemState, ObjectsDefinitionState } from '../../../types/forms'
  import type { JsonObject } from '../../../types/json'
  import { useDefinitionNames } from '../../../hooks/forms/useDefinitionNames'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { applyDefinitionState, definitionFormState } from '../../../utils/forms/definitions'
  import { diagnosticFieldProps, diagnosticSeverity } from '../../../utils/forms/diagnostics'
  import AclForm from '../../shared/forms/AclForm.vue'
  import AttributeListEditor from '../../shared/forms/AttributeListEditor.vue'
  import FormulaEditor from '../../shared/forms/FormulaEditor.vue'
  import ObjectListEditor from '../../shared/forms/ObjectListEditor.vue'

  const { kind, doc } = defineProps<{
    kind: DefinitionKind
    doc: JsonObject
    errorPaths?: string[][]
    warningPaths?: string[][]
  }>()

  const emit = defineEmits<{
    (e: 'update:doc', value: JsonObject): void
  }>()

  const { t } = useAbacI18n()
  const attributeNames = useDefinitionNames('attributes')
  const objectNames = useDefinitionNames('objects')

  const defaultExpression: ExpressionState = {
    kind: 'comparison',
    operator: 'eq',
    left: { source: 'literal', literalOption: 'strVal', value: '' },
    right: { source: 'literal', literalOption: 'strVal', value: '' },
  }

  const emptyDefinitionStates: Record<DefinitionKind, DefinitionFormState> = {
    attributes: { kind: 'attributes', attributes: { entries: [], references: [] } },
    acls: { kind: 'acls', acls: { acl: {} } },
    objects: { kind: 'objects', objects: { entries: [], references: [] } },
    formulas: { kind: 'formulas', formulas: { expression: null } },
  }

  /**
   * Keep the last decoded draft during transient unsupported input; computed
   * getters only read state, while the watcher maintains the fallback.
   */
  const lastState = ref<DefinitionFormState>(emptyDefinitionStates[kind])
  const parsedState = computed(() => definitionFormState(kind, doc))
  const state = computed<DefinitionFormState>(() => parsedState.value ?? lastState.value)

  const attributesState = computed<AttributesDefinitionState>(() =>
    state.value.kind === 'attributes' ? state.value.attributes : { entries: [], references: [] })

  const aclsState = computed<AclState>(() =>
    state.value.kind === 'acls' ? state.value.acls.acl : {})

  const objectsState = computed<ObjectsDefinitionState>(() =>
    state.value.kind === 'objects' ? state.value.objects : { entries: [], references: [] })

  const expressionState = computed<ExpressionState | null>(() =>
    state.value.kind === 'formulas' ? state.value.formulas.expression : null)

  watch(parsedState, parsed => {
    if (parsed) lastState.value = parsed
  }, { immediate: true, flush: 'sync' })

  function commitState (state: DefinitionFormState): void {
    emit('update:doc', applyDefinitionState(doc, state))
  }

  function onEntryUpdate (entries: AttributeSourceState[]): void {
    if (state.value.kind !== 'attributes') return
    commitState({ kind: 'attributes', attributes: { ...state.value.attributes, entries } })
  }

  function onReferencesUpdate (value: unknown[]): void {
    if (state.value.kind !== 'attributes') return
    commitState({ kind: 'attributes', attributes: { ...state.value.attributes, references: value.map(String) } })
  }

  function onAclUpdate (acl: AclState): void {
    if (state.value.kind !== 'acls') return
    commitState({ kind: 'acls', acls: { acl } })
  }

  function onObjectEntriesUpdate (entries: ObjectItemState[]): void {
    if (state.value.kind !== 'objects') return
    commitState({ kind: 'objects', objects: { ...state.value.objects, entries } })
  }

  function onObjectReferencesUpdate (value: unknown[]): void {
    if (state.value.kind !== 'objects') return
    commitState({
      kind: 'objects',
      objects: {
        ...state.value.objects,
        references: value.map(String),
      },
    })
  }

  function onExpressionUpdate (expression: ExpressionState): void {
    if (state.value.kind !== 'formulas') return
    commitState({ kind: 'formulas', formulas: { expression } })
  }
</script>
