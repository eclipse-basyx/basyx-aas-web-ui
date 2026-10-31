<template>
  <!-- Toggles the EdcAssetOAuth2Drawer, the badge marks configured OAuth2 values -->
  <v-tooltip location="bottom" open-delay="600" text="OAuth2 for EDC assets">
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
          <v-icon icon="mdi-key-variant" />
        </v-badge>
      </v-btn>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
  defineProps<{
    configured: boolean
  }>()

  const drawer = defineModel<boolean>({ required: true })
</script>
