<template>
  <SelectableListItem
    :active="isSelected"
    :loading="loading"
    skeleton-type="list-item-three-line"
    @click="onSelectPolicy(policy!.version_id)"
  >
    <v-list-item-title class="d-flex align-center my-1 text-primary">
      <span class="text-title-small">v{{ policy!.version_id }}</span>
      <v-spacer />
      <PolicyStatus :status="policy!.status" />
    </v-list-item-title>

    <v-list-item-subtitle class="d-flex flex-column text-listItemText ga-1">
      <span class="d-flex align-center ga-2 ">
        <v-icon :icon="ICONS.SCOPE" size="x-small" />
        {{ policy!.service_scope ?? '—' }}
      </span>

      <div v-if="policy!.created_at || policy!.updated_at" class="d-flex ga-2">
        <span v-if="policy!.created_at" class="d-flex align-center ga-2">
          <v-icon :icon="ICONS.CREATED" size="x-small" />
          {{ new Date(policy!.created_at).toISOString().slice(0, 10) }}
        </span>

        <span v-if="policy!.updated_at" class="d-flex align-center ga-2">
          <v-icon :icon="ICONS.UPDATED" size="x-small" />
          {{ new Date(policy!.updated_at).toISOString().slice(0, 10) }}
        </span>
      </div>

      <span class="d-flex align-center ga-2" style="min-width: 0">
        <v-icon class="flex-shrink-0" :icon="ICONS.HASH" size="x-small" />
        <span class="text-truncate">{{ policy!.policy_id }}</span>
      </span>
    </v-list-item-subtitle>

    <template #action>
      <PolicyOptions icon-size="x-small" :policy="policy!" />
    </template>

  </SelectableListItem>
</template>

<script setup lang="ts">
  import type { PolicyVersion } from '../../../types/policy'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import SelectableListItem from '../../shared/SelectableListItem.vue'
  import PolicyOptions from '../options/PolicyOptions.vue'
  import PolicyStatus from '../PolicyStatus.vue'

  const ICONS = {
    HASH: 'mdi-pound',
    SCOPE: 'mdi-server',
    CREATED: 'mdi-calendar-clock',
    UPDATED: 'mdi-calendar-edit',
  } as const

  const { policy, loading } = defineProps<{ policy?: PolicyVersion, loading?: boolean }>()

  const { selectedPolicyVersion, onSelectPolicy } = useAbacNavigation()
  const isSelected = computed(() =>
    selectedPolicyVersion.value?.toString() === policy?.version_id?.toString(),
  )
</script>
