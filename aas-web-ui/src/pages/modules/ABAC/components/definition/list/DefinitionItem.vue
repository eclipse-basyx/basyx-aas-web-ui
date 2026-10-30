<template>
  <SelectableListItem
    :active="isSelected"
    :loading="loading"
    skeleton-type="text"
    @click="onSelectDefinition(definition!.name, kind!)"
  >
    <v-list-item-title class="d-flex align-center text-primary">
      {{ definition!.name }}
      <DefinitionUsageBadge :usages="usages" />
    </v-list-item-title>

    <template #action>
      <DefinitionOptions v-if="staged && definition && kind" :definition="definition!" :delete-disabled="usages.length > 0" :kind="kind!" />
    </template>

  </SelectableListItem>
</template>

<script setup lang="ts">
  import type { Definition, DefinitionKind } from '../../../types/definitions'
  import { useAbacNavigation } from '../../../hooks/navigation/useAbacNavigation'
  import { useDefinitionUsage } from '../../../hooks/resources/useDefinitionUsage'
  import SelectableListItem from '../../shared/list/SelectableListItem.vue'
  import DefinitionUsageBadge from '../DefinitionUsageBadge.vue'
  import DefinitionOptions from './DefinitionOptions.vue'

  const { definition, kind } = defineProps<{
    definition?: Definition
    kind?: DefinitionKind
    loading?: boolean
    staged?: boolean
  }>()

  const { usages } = useDefinitionUsage(() => definition, () => kind)
  const { selectedDefinitionName, selectedDefinitionKind, onSelectDefinition } = useAbacNavigation()
  const isSelected = computed(() => selectedDefinitionName.value?.toString() === definition?.name?.toString() && selectedDefinitionKind.value === kind)
</script>
