<template>
  <div class="d-flex flex-column ga-4">
    <DraggableList v-model="modelValue">
      <template #default="{ item, index }">
        <ObjectEntryEditor
          hide-help
          :hide-value="item.kind === 'FRAGMENT'"
          :messages="severityFor(index) ? [t(severityFor(index) === 'error' ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning')] : []"
          :model-value="item"
          :severity="severityFor(index)"
          @update:model-value="update(index, $event)"
        />
      </template>

      <template #body="{ item, index }">
        <FragmentEditor
          v-if="item.kind === 'FRAGMENT'"
          class="mt-4"
          :messages="severityFor(index) ? [t(severityFor(index) === 'error' ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning')] : []"
          :model-value="item.value"
          :severity="severityFor(index)"
          @update:model-value="update(index, { ...item, value: $event })"
        />

        <v-divider v-if="index < modelValue.length - 1" class="mt-4" />
      </template>

      <template #actions="{ item, index }">
        <AbacHelp :text="t(`forms.objectEntry.valueHelp.${item.kind}`)" topic="objects" />

        <v-btn
          :aria-label="t('forms.list.remove')"
          color="error"
          :icon="ICONS.REMOVE"
          size="small"
          variant="text"
          @click="remove(index)"
        >
          <v-icon :icon="ICONS.REMOVE" />
          <v-tooltip activator="parent" location="top" open-delay="600">{{ t('forms.list.remove') }}</v-tooltip>
        </v-btn>
      </template>
    </DraggableList>

    <ListAddActions :empty="modelValue.length === 0" :empty-text="t('forms.list.empty')">
      <v-btn
        :aria-label="t('forms.list.add')"
        class="flex-shrink-0"
        color="primary"
        density="comfortable"
        :prepend-icon="ICONS.ADD"
        variant="outlined"
        v-bind="i18nData('forms.list.add')"
        @click="add"
      >
        {{ t('forms.list.add') }}
      </v-btn>
    </ListAddActions>
  </div>
</template>

<script setup lang="ts">
  import type { ObjectItemState } from '../../../types/forms'
  import { useListRows } from '../../../hooks/forms/useListRows'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { diagnosticSeverity } from '../../../utils/forms/diagnostics'
  import DraggableList from '../list/DraggableList.vue'
  import AbacHelp from './AbacHelp.vue'
  import FragmentEditor from './FragmentEditor.vue'
  import ListAddActions from './ListAddActions.vue'
  import ObjectEntryEditor from './ObjectEntryEditor.vue'

  const ICONS = {
    ADD: 'mdi-plus',
    REMOVE: 'mdi-delete',
  } as const

  const modelValue = defineModel<ObjectItemState[]>({ required: true })
  const { errorPaths = [], warningPaths = [] } = defineProps<{ errorPaths?: string[][], warningPaths?: string[][] }>()

  const { t, i18nData } = useAbacI18n()

  const { add, update, remove } = useListRows(
    () => modelValue.value,
    entries => (modelValue.value = entries),
    (): ObjectItemState => ({ kind: 'ROUTE', value: '' }),
  )

  function severityFor (index: number) {
    return diagnosticSeverity(errorPaths, warningPaths, String(index))
  }

</script>
