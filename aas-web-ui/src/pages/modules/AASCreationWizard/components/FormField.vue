<template>
  <div class="mb-4">
    <div class="d-flex align-center mb-2">
      <label class="text-body-1 font-weight-medium mr-2">
        {{ label }}
      </label>

      <v-tooltip v-if="tip" location="top">
        <template #activator="{ props }">
          <v-icon v-bind="props" class="cursor-pointer" color="medium-emphasis" size="18">
            mdi-information-outline
          </v-icon>
        </template>
        <span>{{ tip }}</span>
      </v-tooltip>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    label: string
    tip?: string
  }>()
</script>
