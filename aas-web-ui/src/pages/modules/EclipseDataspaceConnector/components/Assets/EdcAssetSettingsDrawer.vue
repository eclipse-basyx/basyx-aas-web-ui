<template>
  <!-- Optional settings of the Asset data addresses, e.g. OAuth2; the default slot takes their fields -->
  <v-navigation-drawer
    v-model="drawer"
    color="appNavigation"
    location="end"
    :width="336"
  >
    <!-- Same height as the tab bar of JsonPreviewTabs (55px), so both dividers align -->
    <v-sheet class="d-flex align-center px-4 text-title-medium" color="transparent" height="55">
      {{ title }}
    </v-sheet>

    <v-divider />

    <div class="d-flex flex-column ga-6 pa-4">
      <slot />
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    title?: string
  }>(), {
    title: 'Add OAuth2 for Assets',
  })

  const drawer = defineModel<boolean>({ required: true })
</script>
