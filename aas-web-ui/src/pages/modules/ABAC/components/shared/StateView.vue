<template>
  <slot v-if="!loading && !error && !empty" />

  <div v-else-if="loading" class="h-100 d-flex flex-column align-center justify-center text-grey">
    <v-progress-circular color="primary" indeterminate :size="loadingSize" :width="loadingWidth" />
    <span v-if="loadingLabel" class="text-caption mt-2">{{ loadingLabel }}</span>
  </div>

  <div v-else-if="error" class="h-100 d-flex flex-column align-center justify-center text-error">
    <v-icon class="mb-2" :size="iconSize">{{ iconError }}</v-icon>
    <div v-if="errorLabel" class="text-caption">{{ errorLabel }}</div>
  </div>

  <div v-else class="h-100 d-flex flex-column align-center justify-center text-grey">
    <v-icon class="mb-2" :size="iconSize">{{ iconEmpty }}</v-icon>
    <div v-if="emptyLabel" class="text-caption">{{ emptyLabel }}</div>
  </div>

</template>

<script setup lang="ts">
  defineProps<{
    loading?: boolean
    error?: boolean
    empty?: boolean
    iconError?: string
    iconEmpty?: string
    iconSize?: string | number
    loadingSize?: string | number
    loadingWidth?: string | number
    errorLabel?: string
    emptyLabel?: string
    loadingLabel?: string
  }>()
</script>
