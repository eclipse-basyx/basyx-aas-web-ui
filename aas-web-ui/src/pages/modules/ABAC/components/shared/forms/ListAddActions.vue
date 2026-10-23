<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-2">
    <span v-if="empty" class="text-body-small text-medium-emphasis">{{ emptyText }}</span>

    <div class="flex-shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ empty: boolean, emptyText: string }>()
</script>
