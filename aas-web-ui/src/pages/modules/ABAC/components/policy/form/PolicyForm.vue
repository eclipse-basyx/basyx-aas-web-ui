<template>
  <v-expansion-panels v-model="openSections" eager multiple>
    <FormGroup
      v-for="kind in DEFINITION_KINDS"
      :key="kind"
      :diagnostic-keys="[DEFINITION_LIST_KEYS[kind]]"
      :diagnostic-prefix="['AllAccessPermissionRules']"
      :error="pathsFor(DEFINITION_LIST_KEYS[kind]).length > 0"
      :help-topic="kind"
      :hint="t(`forms.sectionHelp.${kind}`)"
      :title="t(`definitions.${kind}`)"
      :value="kind"
      :warning="pathsFor(DEFINITION_LIST_KEYS[kind], undefined, warningPaths).length > 0"
    >
      <CollapsibleList
        :expand-request="expandRequests[kind]"
        :item-key="item => JSON.stringify(item.entry.doc)"
        :model-value="kindEntries(kind)"
        @update:model-value="onDefinitionsReorder(kind, $event)"
      >
        <template #default="{ item }">
          <span :class="{ 'text-error': definitionPaths(item.entry.kind, item.index).length > 0, 'text-warning': definitionPaths(item.entry.kind, item.index).length === 0 && definitionPaths(item.entry.kind, item.index, warningPaths).length > 0 }"><DiagnosticIndicator :severity="definitionPaths(item.entry.kind, item.index).length > 0 ? 'error' : definitionPaths(item.entry.kind, item.index, warningPaths).length > 0 ? 'warning' : undefined" />{{ definitionLabel(item) }}</span>
        </template>

        <template #body="{ item }">
          <div class="d-flex flex-column ga-4">
            <v-text-field
              density="comfortable"
              :disabled="definitionInUse(item.index)"
              v-bind="diagnosticFieldProps(definitionPaths(item.entry.kind, item.index), definitionPaths(item.entry.kind, item.index, warningPaths), t, 'name')"
              :error-messages="definitionNameErrors(item)"
              hide-details="auto"
              :hint="definitionUsageHint(item.index)"
              :label="`${t('definitions.definitionDialog.name')} *`"
              :model-value="definitionName(item)"
              persistent-hint
              variant="outlined"
              @update:model-value="onDefinitionNameUpdate(item.index, $event)"
            />

            <DefinitionForm
              :doc="item.entry.doc"
              :error-paths="definitionPaths(item.entry.kind, item.index)"
              :kind="item.entry.kind"
              :warning-paths="definitionPaths(item.entry.kind, item.index, warningPaths)"
              @update:doc="onDefinitionDocUpdate(item.index, $event)"
            />
          </div>
        </template>

        <template #actions="{ item }">
          <span class="d-flex">
            <v-btn
              :aria-label="t('forms.list.remove')"
              color="error"
              :disabled="definitionInUse(item.index)"
              :icon="ICONS.REMOVE"
              size="small"
              variant="text"
              @click="onRemoveDefinition(item.index)"
            />

            <v-tooltip activator="parent" location="top" open-delay="600">{{ definitionUsageHint(item.index) || t('forms.list.remove') }}</v-tooltip>
          </span>

        </template>

        <template #help="{ item }">
          <AbacHelp :text="t(`forms.sectionHelp.${item.entry.kind}`)" :topic="item.entry.kind" />
        </template>
      </CollapsibleList>

      <ListAddActions :empty="kindEntries(kind).length === 0" :empty-text="t('forms.policy.noDefinitions')">
        <v-btn
          color="primary"
          density="comfortable"
          :prepend-icon="ICONS.ADD"
          variant="outlined"
          v-bind="i18nData('forms.policy.addDefinition')"
          @click="onAddDefinition(kind)"
        >
          {{ t('forms.policy.addDefinition') }}
        </v-btn>
      </ListAddActions>
    </FormGroup>

    <FormGroup
      :diagnostic-keys="['rules']"
      :diagnostic-prefix="['AllAccessPermissionRules']"
      :error="pathsFor('rules').length > 0"
      help-topic="rules"
      :hint="t('forms.sectionHelp.rules')"
      :title="t('forms.policy.rules')"
      value="rules"
      :warning="pathsFor('rules', undefined, warningPaths).length > 0"
    >
      <CollapsibleList :expand-request="expandRequests.rules" :model-value="state.rules" @update:model-value="onRulesReorder">
        <template #default="{ index }">
          <span :class="{ 'text-error': pathsFor('rules', index).length > 0, 'text-warning': pathsFor('rules', index).length === 0 && pathsFor('rules', index, warningPaths).length > 0 }"><DiagnosticIndicator :severity="pathsFor('rules', index).length > 0 ? 'error' : pathsFor('rules', index, warningPaths).length > 0 ? 'warning' : undefined" />{{ ruleTitle(index) }}</span>
        </template>

        <template #body="{ item: rule, index }">
          <RuleForm
            :diagnostic-prefix="['AllAccessPermissionRules', 'rules', String(index)]"
            :doc="rule"
            :error-paths="pathsFor('rules', index)"
            :warning-paths="pathsFor('rules', index, warningPaths)"
            @update:doc="updateRule(index, $event)"
          />
        </template>

        <template #actions="{ index }">
          <v-btn
            :aria-label="t('forms.list.remove')"
            color="error"
            :icon="ICONS.REMOVE"
            size="small"
            variant="text"
            @click="removeRule(index)"
          >
            <v-icon :icon="ICONS.REMOVE" />
            <v-tooltip activator="parent" location="top" open-delay="600">{{ t('forms.list.remove') }}</v-tooltip>
          </v-btn>

        </template>

        <template #help>
          <AbacHelp :text="t('forms.sectionHelp.rules')" topic="rules" />
        </template>
      </CollapsibleList>

      <ListAddActions :empty="state.rules.length === 0" :empty-text="t('forms.policy.noRules')">
        <v-btn
          color="primary"
          density="comfortable"
          :prepend-icon="ICONS.ADD"
          variant="outlined"
          v-bind="i18nData('forms.policy.addRule')"
          @click="addRule"
        >
          {{ t('forms.policy.addRule') }}
        </v-btn>
      </ListAddActions>
    </FormGroup>
  </v-expansion-panels>
</template>

<script setup lang="ts">
  import type { DefinitionKind } from '../../../types/definitions'
  import type { JsonObject } from '../../../types/json'
  import type { PolicyDraft, PolicyDraftDefinition } from '../../../types/policy'
  import { DEFINITION_LIST_KEYS } from '../../../constants/forms'
  import { FORM_DIAGNOSTICS_KEY, POLICY_FORM_CONTEXT_KEY } from '../../../constants/inject'
  import { EMPTY_DEFINITION, EMPTY_RULE } from '../../../constants/json'
  import { useListRows } from '../../../hooks/forms/useListRows'
  import { usePolicyFormContext } from '../../../hooks/forms/usePolicyFormContext'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { DEFINITION_KINDS } from '../../../types/definitions'
  import { diagnosticFieldProps, sectionDiagnosticMessages } from '../../../utils/forms/diagnostics'
  import { applyPolicyDraft, policyDraftState } from '../../../utils/forms/policy'
  import DefinitionForm from '../../definition/form/DefinitionForm.vue'
  import RuleForm from '../../rule/form/RuleForm.vue'
  import AbacHelp from '../../shared/forms/AbacHelp.vue'
  import DiagnosticIndicator from '../../shared/forms/DiagnosticIndicator.vue'
  import FormGroup from '../../shared/forms/FormGroup.vue'
  import ListAddActions from '../../shared/forms/ListAddActions.vue'
  import CollapsibleList from '../../shared/list/CollapsibleList.vue'

  defineOptions({ name: 'PolicyForm' })

  const ICONS = {
    ADD: 'mdi-plus',
    REMOVE: 'mdi-delete',
  } as const

  const { doc, errorPaths = [], warningPaths = [] } = defineProps<{
    doc: JsonObject
    errorPaths?: string[][]
    warningPaths?: string[][]
  }>()

  const emit = defineEmits<{
    (e: 'update:doc', value: JsonObject): void
  }>()

  const openSections = ref<string[]>([])
  const expandRequests = reactive<Partial<Record<DefinitionKind | 'rules', { index: number }>>>({})

  const { t, i18nData } = useAbacI18n()
  const diagnostics = inject(FORM_DIAGNOSTICS_KEY, computed(() => ({ error: null, advisory: null })))

  const state = computed<PolicyDraft>(() => policyDraftState(doc) ?? { definitions: [], rules: [] })
  const formContext = usePolicyFormContext(() => state.value)
  provide(POLICY_FORM_CONTEXT_KEY, formContext)

  const definitionUsages = computed(() => state.value.definitions.map(entry =>
    typeof entry.doc.name === 'string' ? formContext.usagesOf(entry.kind, entry.doc.name) : []))

  /**
   * Strip the policy envelope and optional item index before passing diagnostics
   * to nested editors. Root-level issues stay in the dialog summary.
   */
  function pathsFor (key: (typeof DEFINITION_LIST_KEYS)[DefinitionKind] | 'rules', index?: number, paths = errorPaths): string[][] {
    return paths
      .filter(path => path[0] === 'AllAccessPermissionRules' && path[1] === key
        && (index === undefined || path[2] === String(index)))
      .map(path => path.slice(index === undefined ? 2 : 3))
  }

  function definitionPaths (kind: DefinitionKind, sourceIndex: number, paths = errorPaths): string[][] {
    const index = kindEntries(kind).findIndex(item => item.index === sourceIndex)
    return index === -1 ? [] : pathsFor(DEFINITION_LIST_KEYS[kind], index, paths)
  }

  function definitionNameErrors (item: { entry: PolicyDraftDefinition, index: number }): string[] {
    if (!definitionPaths(item.entry.kind, item.index).some(path => path[0] === 'name')) return []
    const index = kindEntries(item.entry.kind).findIndex(entry => entry.index === item.index)
    const messages = sectionDiagnosticMessages(diagnostics.value.error, null,
                                               ['AllAccessPermissionRules', DEFINITION_LIST_KEYS[item.entry.kind], String(index), 'name'])
    if (messages.length > 0) return messages
    return [t(definitionName(item).trim() === '' ? 'definitions.definitionDialog.errors.requiredName' : 'forms.validation.fieldError')]
  }

  function definitionInUse (index: number): boolean {
    return (definitionUsages.value[index]?.length ?? 0) > 0
  }

  function definitionUsageHint (index: number): string | undefined {
    const usage = definitionUsages.value[index] ?? []
    if (usage.length === 0) return undefined
    return t('definitions.usage.usedBy', { usage: usage.map(item => item.kind === 'rule'
      ? t('definitions.usage.rule', { index: item.ruleIndex })
      : t('definitions.usage.definition', { kind: t(`definitions.${item.definitionKind}`), name: item.name })).join(', ') })
  }

  /**
   * Per-kind lists retain their source indexes for editing and dependency checks.
   */
  const entriesByKind = computed<Record<DefinitionKind, Array<{ index: number, entry: PolicyDraftDefinition }>>>(
    () => {
      const groups = { attributes: [], acls: [], objects: [], formulas: [] } as Record<DefinitionKind, Array<{ index: number, entry: PolicyDraftDefinition }>>
      for (const [index, entry] of state.value.definitions.entries()) {
        groups[entry.kind].push({ index, entry })
      }
      return groups
    },
  )

  function kindEntries (kind: DefinitionKind): Array<{ index: number, entry: PolicyDraftDefinition }> {
    return entriesByKind.value[kind]
  }

  function definitionLabel (item: { entry: PolicyDraftDefinition }): string {
    const name = typeof item.entry.doc.name === 'string' && item.entry.doc.name !== '' ? item.entry.doc.name : undefined
    return name ?? t('forms.policy.unnamed')
  }

  function definitionName (item: { entry: PolicyDraftDefinition }): string {
    return typeof item.entry.doc.name === 'string' ? item.entry.doc.name : ''
  }

  function ruleTitle (index: number): string {
    return t('forms.policy.ruleIndex', { index: index + 1 })
  }

  function onAddDefinition (kind: DefinitionKind): void {
    expandRequests[kind] = { index: kindEntries(kind).length }
    commit({
      ...state.value,
      definitions: [...state.value.definitions, {
        kind,
        doc: structuredClone(EMPTY_DEFINITION[kind]) as JsonObject,
      }],
    })
  }

  function onRemoveDefinition (index: number): void {
    if (definitionInUse(index)) return
    const definitions = state.value.definitions.filter((_, i) => i !== index)
    commit({ ...state.value, definitions })
  }

  function onDefinitionsReorder (kind: DefinitionKind, entries: Array<{ index: number, entry: PolicyDraftDefinition }>): void {
    let position = 0
    const definitions = state.value.definitions.map(entry => entry.kind === kind ? entries[position++]!.entry : entry)
    commit({ ...state.value, definitions })
  }

  function onDefinitionDocUpdate (index: number, doc: JsonObject): void {
    const definitions = state.value.definitions.map((entry, i) => (i === index ? { ...entry, doc } : entry))
    commit({ ...state.value, definitions })
  }

  function onDefinitionNameUpdate (index: number, value: unknown): void {
    if (definitionInUse(index)) return
    const name = typeof value === 'string' ? value : ''
    const definitions = state.value.definitions.map((entry, i) => (i === index ? { ...entry, doc: { ...entry.doc, name } } : entry))
    commit({ ...state.value, definitions })
  }

  function onRulesReorder (rules: JsonObject[]): void {
    commit({ ...state.value, rules })
  }

  const { add: appendRule, update: updateRule, remove: removeRule } = useListRows(
    () => [...(state.value.rules as JsonObject[])],
    rules => commit({ ...state.value, rules }),
    () => structuredClone(EMPTY_RULE) as JsonObject,
  )

  function addRule (): void {
    expandRequests.rules = { index: state.value.rules.length }
    appendRule()
  }

  function commit (updated: PolicyDraft): void {
    emit('update:doc', applyPolicyDraft(doc, updated))
  }
</script>
