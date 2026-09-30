<template>
  <v-list-item @click.stop="$emit('click')">
    <template #prepend>
      <v-icon :color="color" size="x-small">{{ icon }}</v-icon>
    </template>

    <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
  </v-list-item>
</template>

<script setup lang="ts">
  defineProps<{ icon: string, label: string, color?: string }>()
  defineEmits<{ (e: 'click'): void }>()
</script>
