<template>
  <v-list-item border class="pa-0 mb-2" rounded="lg">
    <template #prepend>
      <v-btn
        class="ma-2"
        density="compact"
        :disabled="!canGoUp"
        icon="mdi-chevron-up"
        @click="$emit('go-up')"
      />

      <v-divider vertical />
    </template>

    <v-breadcrumbs class="ma-0 pa-0 ml-2" divider="/" :items="breadcrumbs" />
  </v-list-item>
</template>

<script setup lang="ts">
  import type { BreadcrumbItem } from '../types'

  interface Props {
    breadcrumbs: BreadcrumbItem[]
    canGoUp: boolean
  }

  defineProps<Props>()

  defineEmits<{
    (e: 'go-up'): void
  }>()
</script>
