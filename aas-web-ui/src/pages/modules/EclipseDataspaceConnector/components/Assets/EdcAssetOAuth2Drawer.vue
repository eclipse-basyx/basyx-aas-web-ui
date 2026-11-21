<template>
  <!-- Optional OAuth2 of the Asset data addresses, the default slot takes the EdcAssetOAuth2Fields -->
  <v-navigation-drawer
    v-model="drawer"
    color="appNavigation"
    location="end"
    :width="336"
  >
    <!-- Same height as the tab bar of JsonPreviewTabs, so both dividers align -->
    <div class="d-flex align-center px-4 text-title-medium" style="height: 47px">
      Add OAuth2 for Assets
    </div>

    <v-divider />

    <div class="d-flex flex-column ga-6 pa-4">
      <slot />
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  const drawer = defineModel<boolean>({ required: true })
</script>
