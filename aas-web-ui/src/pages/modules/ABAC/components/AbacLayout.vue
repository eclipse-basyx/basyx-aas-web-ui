<script setup lang="ts">
  import PolicyDetail from './policy/detail/PolicyDetail.vue'
  import PoliciesList from './policy/list/PoliciesList.vue'

  defineProps<{ loading: boolean }>()
</script>

<template>
  <div v-if="loading" class="h-100 w-100 d-flex justify-center align-center">
    <v-progress-circular color="primary" indeterminate :size="70" :width="8" />
  </div>

  <div
    v-else
    class="h-100 d-flex overflow-hidden mx-auto"
    style="height: calc(100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 40px) - 2px); max-width: 1440px;"
  >

    <PoliciesList />
    <PolicyDetail />
  </div>
</template>
