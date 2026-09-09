<template>
  <v-container v-if="loading" class="h-100 w-100 d-flex justify-center align-center">
    <v-progress-circular color="primary" indeterminate :size="70" :width="8" />
  </v-container>

  <v-container
    v-else
    class="d-flex pa-0"
    fluid
    style="height: calc(100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 40px) - 2px)"
  >
    <PoliciesList />

    <v-container class="pa-0 d-flex flex-column overflow-y-auto" style="max-width: 1440px; min-height: 0;">
      <PolicyDetail />
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
  import PolicyDetail from '@/pages/modules/ABAC/components/policy/detail/PolicyDetail.vue'
  import PoliciesList from '@/pages/modules/ABAC/components/policy/list/PoliciesList.vue'

  defineProps<{ loading: boolean }>()
</script>
