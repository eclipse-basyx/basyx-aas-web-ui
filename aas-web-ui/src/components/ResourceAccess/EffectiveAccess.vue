<template>
  <div class="d-flex align-center flex-wrap ga-2">
    <span class="text-body-small text-medium-emphasis">Your access:</span>

    <v-chip
      v-if="granted.length === 0"
      label
      size="small"
      text="None"
    />

    <v-tooltip
      v-for="right in granted"
      :key="right.action"
      location="bottom"
      :text="sourceLabels[right.source]"
    >
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          :color="right.source === 'rebac' ? 'primary' : undefined"
          label
          :prepend-icon="actionIcons[right.action]"
          size="small"
          :text="actionLabels[right.action]"
          variant="tonal"
        />
      </template>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
  import type { EffectiveAction, EffectiveRights, EffectiveSource } from '@/types/ResourceAccess'

  const props = defineProps<{
    rights?: EffectiveRights
  }>()

  const actionLabels: Record<EffectiveAction, string> = {
    read: 'View', update: 'Edit', delete: 'Delete', execute: 'Run operations', manage: 'Manage access',
  }

  const actionIcons: Record<EffectiveAction, string> = {
    read: 'mdi-eye-outline', update: 'mdi-pencil-outline', delete: 'mdi-delete-outline',
    execute: 'mdi-play-circle-outline', manage: 'mdi-account-key-outline',
  }

  const sourceLabels: Record<EffectiveSource, string> = {
    'abac': 'Granted by the access policy',
    'abac-conditional': 'Granted by the access policy for matching content',
    'rebac': 'Shared with you',
    'administrator': 'You are an administrator',
    'none': 'Not granted',
  }

  const granted = computed(() => props.rights?.rights.filter(right => right.source !== 'none') ?? [])
</script>
