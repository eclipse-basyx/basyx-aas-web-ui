<template>
  <v-container class="pa-0 ma-0" fluid :style="{ 'height': fullHeight}">

    <v-layout :style="{ 'height': fullHeight}">
      <v-navigation-drawer
        class="leftMenu"
        color="appNavigation"
        :width="336"
      >
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title class="py-3" /></v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid />
      </v-main>
    </v-layout>
  </v-container>
</template>

<script lang="ts" setup>

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border

  // Computed properties

</script>
