<template>
  <v-empty-state
    v-if="aasUnavailable === 'failed'"
    icon="mdi-database-alert-outline"
    text="No AAS can be selected, as the AAS could not be loaded"
    title="AAS Not Available"
  >
    <template #media>
      <v-icon size="64" />
    </template>
  </v-empty-state>

  <v-empty-state
    v-else-if="aasUnavailable === 'empty'"
    class="text-divider"
    text="No AAS can be selected, as the infrastructure does not contain any AAS"
    title="No existing AAS"
  />

  <!-- Greyed out until an infrastructure is selected -->
  <v-empty-state
    v-else
    :class="{ 'text-divider': !infrastructureSelected }"
    icon="mdi-gesture-tap"
    :text="text"
    title="Select AAS"
  >
    <template #media>
      <v-icon :color="infrastructureSelected ? undefined : 'divider'" size="64" />
    </template>
  </v-empty-state>
</template>

<script lang="ts" setup>
  // Why the AAS List of the selected infrastructure offers no AAS to select
  export type AasUnavailableReason = 'failed' | 'empty'

  // Empty state of a view showing the AAS selected in the AAS List of an infrastructure
  defineProps<{
    infrastructureSelected: boolean
    aasUnavailable?: AasUnavailableReason | null
    text: string
  }>()
</script>
