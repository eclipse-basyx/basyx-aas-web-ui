<template>
  <SelectableListItem
    :active="isSelected"
    :loading="loading"
    skeleton-type="text"
    @click="onSelectDefinition(definition!.name, kind!)"
  >
    <v-list-item-title class="d-flex align-center text-primary">
      {{ definition!.name }}
    </v-list-item-title>

    <template #action>
      <DefinitionOptions v-if="staged && definition && kind" :definition="definition!" :kind="kind!" />
    </template>

  </SelectableListItem>
</template>

<script setup lang="ts">
  import type { Definition, DefinitionKind } from '../../../types/definitions'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import SelectableListItem from '../../shared/SelectableListItem.vue'
  import DefinitionOptions from './DefinitionOptions.vue'

  const { definition, kind, loading, staged } = defineProps<{
    definition?: Definition
    kind?: DefinitionKind
    loading?: boolean
    staged?: boolean
  }>()

  const { selectedDefinitionName, selectedDefinitionKind, onSelectDefinition } = useAbacNavigation()
  const isSelected = computed(() => selectedDefinitionName.value?.toString() === definition?.name?.toString() && selectedDefinitionKind.value === kind)
</script>
