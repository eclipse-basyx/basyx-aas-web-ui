<template>
  <v-card border class="mb-3" rounded="lg">
    <v-card-title>{{ route.meta.title }}</v-card-title>

    <v-card-text>
      This page is a child route of the TestChildRoutes module.
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router'

  const route = useRoute()
</script>
