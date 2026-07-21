<template>
  <v-btn
    aria-label="Search descriptors"
    class="search-action-button text-buttonText"
    color="primary"
    :disabled="disabled"
    icon="mdi-magnify"
    :loading="isLoading"
    rounded="lg"
    size="x-small"
    variant="flat"
    @click.stop="emit('search')"
  />
</template>

<script lang="ts" setup>
  defineProps<{
    disabled?: boolean
    isLoading: boolean
  }>()

  const emit = defineEmits<{
    search: []
  }>()
</script>
