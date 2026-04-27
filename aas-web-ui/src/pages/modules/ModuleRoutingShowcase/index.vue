<template>
  <v-container class="pa-md-8">
    <v-card border class="pa-4 mb-4" rounded="lg">
      <v-card-title class="text-h5">Module Routing Showcase</v-card-title>

      <v-card-text>
        This module demonstrates nested module routes that stay under
        <strong>/modules/moduleroutingshowcase/**</strong>.
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" :to="{ path: '/modules/moduleroutingshowcase' }" variant="tonal">Home</v-btn>

        <v-btn
          color="primary"
          :to="{ path: '/modules/moduleroutingshowcase/overview' }"
          variant="tonal"
        >Overview</v-btn>

        <v-btn
          color="primary"
          :to="{ path: '/modules/moduleroutingshowcase/details' }"
          variant="tonal"
        >Details</v-btn>
      </v-card-actions>
    </v-card>

    <router-view />
  </v-container>
</template>

<script lang="ts" setup>
  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Module Routing Showcase',
    preserveRouteQuery: true,
  })
</script>
