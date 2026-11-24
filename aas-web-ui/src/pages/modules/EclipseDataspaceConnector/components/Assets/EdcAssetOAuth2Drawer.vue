<template>
  <!-- Optional OAuth2 of the Asset data addresses, the default slot takes the EdcAssetOAuth2Fields -->
  <v-navigation-drawer
    v-model="drawer"
    color="appNavigation"
    location="end"
    :width="336"
  >
    <!-- Same height as the tab bar of JsonPreviewTabs, so both dividers align -->
    <v-sheet class="d-flex align-center px-4 text-title-medium" color="transparent" height="47">
      Add OAuth2 for Assets
    </v-sheet>

    <v-divider />

    <div class="d-flex flex-column ga-6 pa-4">
      <slot />
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  const drawer = defineModel<boolean>({ required: true })
</script>
