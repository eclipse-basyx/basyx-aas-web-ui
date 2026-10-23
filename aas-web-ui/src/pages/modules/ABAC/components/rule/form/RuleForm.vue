<template>
  <v-expansion-panels v-model="openSections" eager multiple>
    <FormGroup
      :diagnostic-keys="['ACL', 'USEACL']"
      :diagnostic-prefix="diagnosticPrefix"
      :error="errorPaths?.some(path => ['ACL', 'USEACL'].includes(path[0] ?? ''))"
      help-topic="access"
      :hint="t('forms.sectionHelp.access')"
      :title="t('forms.sections.access')"
      value="access"
      :warning="warningPaths?.some(path => ['ACL', 'USEACL'].includes(path[0] ?? ''))"
    >
      <v-select
        density="comfortable"
        hide-details="auto"
        :items="[{ title: t('forms.rule.aclInline'), value: 'inline' }, { title: t('forms.rule.useAcl'), value: 'reference' }]"
        :label="t('forms.rule.acl')"
        :model-value="state.acl.mode"
        variant="outlined"
        @update:model-value="onAclModeUpdate"
      />

      <AclForm
        v-if="state.acl.mode === 'inline'"
        :error-paths="errorPaths?.filter(path => path[0] === 'ACL').map(path => path.slice(1))"
        :model-value="state.acl.acl"
        :warning-paths="warningPaths?.filter(path => path[0] === 'ACL').map(path => path.slice(1))"
        @update:model-value="onAclUpdate"
      />

      <v-combobox
        v-else
        :aria-label="t('forms.rule.useAcl')"
        v-bind="fieldDiagnostics('USEACL')"
        density="comfortable"
        hide-details="auto"
        :items="aclNames"
        :label="t('forms.rule.aclCollection')"
        :model-value="state.acl.name ?? ''"
        variant="outlined"
        @update:model-value="onUseAclUpdate"
      />

      <div v-if="state.acl.mode === 'reference' && !state.acl.name" class="text-body-small text-medium-emphasis">
        {{ t('forms.rule.noAclSelected') }}
      </div>
    </FormGroup>

    <FormGroup
      :diagnostic-keys="['OBJECTS', 'USEOBJECTS']"
      :diagnostic-prefix="diagnosticPrefix"
      :error="errorPaths?.some(path => ['OBJECTS', 'USEOBJECTS'].includes(path[0] ?? ''))"
      help-topic="resources"
      :hint="t('forms.sectionHelp.resources')"
      :title="t('forms.sections.resources')"
      value="resources"
      :warning="warningPaths?.some(path => ['OBJECTS', 'USEOBJECTS'].includes(path[0] ?? ''))"
    >
      <ObjectListEditor
        :error-paths="errorPaths.filter(path => path[0] === 'OBJECTS').map(path => path.slice(1))"
        :model-value="state.objects.entries"
        :warning-paths="warningPaths.filter(path => path[0] === 'OBJECTS').map(path => path.slice(1))"
        @update:model-value="onObjectEntriesUpdate"
      />

      <v-combobox
        chips
        closable-chips
        density="comfortable"
        hide-details="auto"
        :items="objectNames"
        :label="t('forms.objects.references')"
        v-bind="fieldDiagnostics('USEOBJECTS')"
        :model-value="state.objects.references"
        multiple
        variant="outlined"
        @update:model-value="onObjectReferencesUpdate"
      />
    </FormGroup>

    <FormGroup
      :diagnostic-keys="['FORMULA', 'USEFORMULA']"
      :diagnostic-prefix="diagnosticPrefix"
      :error="errorPaths?.some(path => ['FORMULA', 'USEFORMULA'].includes(path[0] ?? ''))"
      help-topic="conditions"
      :hint="t('forms.sectionHelp.conditions')"
      :title="t('forms.sections.conditions')"
      value="conditions"
      :warning="warningPaths?.some(path => ['FORMULA', 'USEFORMULA'].includes(path[0] ?? ''))"
    >
      <v-select
        density="comfortable"
        hide-details="auto"
        :items="[{ title: t('forms.rule.formulaInline'), value: 'inline' }, { title: t('forms.rule.useFormula'), value: 'reference' }]"
        :label="t('forms.rule.formula')"
        :model-value="state.formula.mode"
        variant="outlined"
        @update:model-value="onFormulaModeUpdate"
      />

      <div v-if="state.formula.mode === 'inline'" class="d-flex flex-column ga-2">
        <FormulaEditor
          :allowed="'expressions'"
          :error-paths="errorPaths.filter(path => path[0] === 'FORMULA').map(path => path.slice(1))"
          :model-value="state.formula.formula ?? { kind: 'empty' }"
          :warning-paths="warningPaths.filter(path => path[0] === 'FORMULA').map(path => path.slice(1))"
          @update:model-value="onFormulaExpressionUpdate"
        />
      </div>

      <div v-else class="d-flex flex-column ga-1">
        <v-combobox
          :aria-label="t('forms.rule.useFormula')"
          density="comfortable"
          hide-details="auto"
          :items="formulaNames"
          :label="t('forms.rule.formulaCollection')"
          :model-value="state.formula.name ?? ''"
          v-bind="fieldDiagnostics('USEFORMULA')"
          variant="outlined"
          @update:model-value="onUseFormulaUpdate"
        />

        <div v-if="!state.formula.name" class="text-body-small text-medium-emphasis">
          {{ t('forms.rule.noFormulaSelected') }}
        </div>
      </div>
    </FormGroup>

    <FormGroup
      :diagnostic-keys="['FILTER', 'FILTERLIST']"
      :diagnostic-prefix="diagnosticPrefix"
      :error="errorPaths?.some(path => ['FILTER', 'FILTERLIST'].includes(path[0] ?? ''))"
      help-topic="filter"
      :hint="t('forms.sectionHelp.filter')"
      :title="t('forms.sections.filter')"
      value="filter"
      :warning="warningPaths?.some(path => ['FILTER', 'FILTERLIST'].includes(path[0] ?? ''))"
    >
      <CollapsibleList
        :expand-request="filterExpandRequest"
        :model-value="state.filters"
        @update:model-value="onFiltersUpdate"
      >
        <template #default="{ item, index }">
          <DiagnosticIndicator :severity="filterSeverity(index)" />
          <span :class="filterSeverity(index) ? `text-${filterSeverity(index)}` : undefined">{{ t('forms.rule.filterTitle', { index: index + 1 }) }}{{ item.fragment ? `: ${item.fragment}` : '' }}</span>
        </template>

        <template #body="{ item, index }">
          <RuleFilterForm
            :error-paths="filterPaths(index, errorPaths)"
            :model-value="item"
            :warning-paths="filterPaths(index, warningPaths)"
            @update:model-value="onFilterUpdate(index, $event)"
          />
        </template>

        <template #actions="{ index }">
          <v-btn
            :aria-label="t('forms.list.remove')"
            color="error"
            :icon="ICONS.REMOVE"
            size="small"
            variant="text"
            @click="onFilterRemove(index)"
          >
            <v-icon :icon="ICONS.REMOVE" />
            <v-tooltip activator="parent" location="top" open-delay="600">{{ t('forms.list.remove') }}</v-tooltip>
          </v-btn>
        </template>
      </CollapsibleList>

      <ListAddActions :empty="state.filters.length === 0" :empty-text="t('forms.rule.noFilters')">
        <v-btn
          color="primary"
          density="comfortable"
          :prepend-icon="ICONS.ADD"
          variant="outlined"
          @click="onFilterAdd"
        >
          {{ t('forms.rule.addFilter') }}
        </v-btn>
      </ListAddActions>
    </FormGroup>
  </v-expansion-panels>
</template>

<script setup lang="ts">
  import type { AclState, ExpressionState, ObjectItemState, RuleFilterState, RuleState } from '../../../types/forms'
  import type { JsonObject } from '../../../types/json'
  import { useDefinitionNames } from '../../../hooks/forms/useDefinitionNames'
  import { useListRows } from '../../../hooks/forms/useListRows'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { diagnosticFieldProps, diagnosticSeverity } from '../../../utils/forms/diagnostics'
  import { applyRuleState, ruleFormState } from '../../../utils/forms/rule'
  import AclForm from '../../shared/forms/AclForm.vue'
  import DiagnosticIndicator from '../../shared/forms/DiagnosticIndicator.vue'
  import FormGroup from '../../shared/forms/FormGroup.vue'
  import FormulaEditor from '../../shared/forms/FormulaEditor.vue'
  import ListAddActions from '../../shared/forms/ListAddActions.vue'
  import ObjectListEditor from '../../shared/forms/ObjectListEditor.vue'
  import CollapsibleList from '../../shared/list/CollapsibleList.vue'
  import RuleFilterForm from './RuleFilterForm.vue'

  defineOptions({ name: 'RuleForm' })

  const ICONS = { ADD: 'mdi-plus', REMOVE: 'mdi-delete' } as const

  const { doc, errorPaths = [], warningPaths = [], diagnosticPrefix = [] } = defineProps<{
    diagnosticPrefix?: string[]
    doc: JsonObject
    errorPaths?: string[][]
    warningPaths?: string[][]
  }>()

  const emit = defineEmits<{
    (e: 'update:doc', value: JsonObject): void
  }>()

  const { t } = useAbacI18n()
  const aclNames = useDefinitionNames('acls')
  const objectNames = useDefinitionNames('objects')
  const formulaNames = useDefinitionNames('formulas')

  const openSections = ref(['access'])
  const pendingAclReference = ref(false)
  const pendingFormulaReference = ref(false)
  const filterExpandRequest = shallowRef<{ index: number }>()

  const emptyRuleState: RuleState = {
    acl: { mode: 'inline', acl: {} },
    objects: { entries: [], references: [] },
    formula: { mode: 'inline', formula: null },
    filters: [],
  }

  /**
   * Keep the last decoded draft during transient unsupported input; computed
   * getters only read state, while the watcher maintains the fallback.
   */
  const lastState = ref<RuleState>(emptyRuleState)
  const parsedState = computed(() => ruleFormState(doc))
  // An empty reference is omitted from JSON, but its input remains selected while editing.
  const state = computed<RuleState>(() => {
    const decoded = parsedState.value ?? lastState.value
    return {
      ...decoded,
      acl: pendingAclReference.value && !Object.hasOwn(doc, 'ACL') && !Object.hasOwn(doc, 'USEACL')
        ? { mode: 'reference', name: undefined }
        : decoded.acl,
      formula: pendingFormulaReference.value && !Object.hasOwn(doc, 'FORMULA') && !Object.hasOwn(doc, 'USEFORMULA')
        ? { mode: 'reference', name: undefined }
        : decoded.formula,
    }
  })

  const { add: appendFilter, update: onFilterUpdate, remove: onFilterRemove } = useListRows(
    () => state.value.filters,
    onFiltersUpdate,
    (): RuleFilterState => ({ fragment: '', condition: { mode: 'inline', condition: { kind: 'boolean', value: true } } }),
  )

  watch(parsedState, parsed => {
    if (parsed) lastState.value = parsed
    if (Object.hasOwn(doc, 'ACL') || Object.hasOwn(doc, 'USEACL')) pendingAclReference.value = false
    if (Object.hasOwn(doc, 'FORMULA') || Object.hasOwn(doc, 'USEFORMULA')) pendingFormulaReference.value = false
  }, { immediate: true, flush: 'sync' })

  /** Applies severity to a specific field without highlighting unrelated inputs. */
  function fieldDiagnostics (...fieldPath: string[]) {
    return diagnosticFieldProps(errorPaths, warningPaths, t, ...fieldPath)
  }

  function commit (updated: RuleState): void {
    emit('update:doc', applyRuleState(doc, updated))
  }

  function onAclModeUpdate (value: unknown): void {
    const mode = value as RuleState['acl']['mode']
    if (mode === state.value.acl.mode) return
    pendingAclReference.value = mode === 'reference'
    commit({
      ...state.value,
      acl: mode === 'inline' ? { mode: 'inline', acl: {} } : { mode: 'reference', name: '' },
    })
  }

  function onAclUpdate (acl: AclState): void {
    if (state.value.acl.mode !== 'inline') return
    commit({ ...state.value, acl: { mode: 'inline', acl } })
  }

  function onUseAclUpdate (value: unknown): void {
    if (state.value.acl.mode !== 'reference') return
    pendingAclReference.value = referenceName(value) === undefined
    // The form omits a cleared reference; update preparation derives its deletion.
    commit({ ...state.value, acl: { mode: 'reference', name: referenceName(value) } })
  }

  function onObjectEntriesUpdate (entries: ObjectItemState[]): void {
    commit({ ...state.value, objects: { ...state.value.objects, entries } })
  }

  function onObjectReferencesUpdate (value: unknown[]): void {
    commit({ ...state.value, objects: { ...state.value.objects, references: value.map(String) } })
  }

  function onFormulaModeUpdate (value: unknown): void {
    const mode = value as RuleState['formula']['mode']
    if (mode === state.value.formula.mode) return
    pendingFormulaReference.value = mode === 'reference'
    commit({
      ...state.value,
      formula: mode === 'inline' ? { mode: 'inline', formula: null } : { mode: 'reference', name: '' },
    })
  }

  function onFormulaExpressionUpdate (expression: ExpressionState): void {
    if (state.value.formula.mode !== 'inline') return
    commit({ ...state.value, formula: { mode: 'inline', formula: expression.kind === 'empty' ? null : expression } })
  }

  function onUseFormulaUpdate (value: unknown): void {
    if (state.value.formula.mode !== 'reference') return
    pendingFormulaReference.value = referenceName(value) === undefined
    commit({ ...state.value, formula: { mode: 'reference', name: referenceName(value) } })
  }

  function referenceName (value: unknown): string | undefined {
    const name = Array.isArray(value) ? (value.length > 0 ? String(value[0]) : undefined) : (value == null ? undefined : String(value))
    return typeof name === 'string' && name !== '' ? name : undefined
  }

  /** Maps the combined UI order to each filter's original JSON location. */
  function filterPaths (index: number, paths: string[][]): string[][] {
    const legacyIndex = Array.isArray(doc.FILTERLIST) ? doc.FILTERLIST.length : 0
    return paths.flatMap(path => {
      if (path[0] === 'FILTERLIST' && path[1] === String(index)) return [path.slice(2)]
      if (path[0] === 'FILTER' && Object.hasOwn(doc, 'FILTER') && index === legacyIndex) return [path.slice(1)]
      return []
    })
  }

  function filterSeverity (index: number) {
    return diagnosticSeverity(filterPaths(index, errorPaths), filterPaths(index, warningPaths))
  }

  function onFiltersUpdate (filters: RuleFilterState[]): void {
    commit({ ...state.value, filters })
  }

  function onFilterAdd (): void {
    filterExpandRequest.value = { index: state.value.filters.length }
    appendFilter()
  }
</script>
