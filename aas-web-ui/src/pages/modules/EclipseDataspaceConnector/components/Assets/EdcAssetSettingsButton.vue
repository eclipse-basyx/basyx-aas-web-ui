<template>
  <!-- Toggles the EdcAssetSettingsDrawer, the badge marks configured values -->
  <v-tooltip location="bottom" open-delay="600" :text="tooltip">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        :active="drawer"
        :color="drawer ? 'primary' : undefined"
        density="comfortable"
        icon
        variant="text"
        @click="drawer = !drawer"
      >
        <v-badge color="primary" dot :model-value="configured">
          <v-icon :icon="icon" />
        </v-badge>
      </v-btn>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    configured: boolean
    icon?: string
    tooltip?: string
  }>(), {
    icon: 'mdi-key-variant',
    tooltip: 'OAuth2 for Assets',
  })

  const drawer = defineModel<boolean>({ required: true })
</script>
