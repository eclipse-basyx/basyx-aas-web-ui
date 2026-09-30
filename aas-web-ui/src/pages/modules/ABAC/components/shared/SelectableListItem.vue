<template>
  <v-list-item
    v-if="loading"
    class="mt-2 mx-2 pa-0"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': isDark ? '#686868 !important' : '#ABABAB !important',
    }"
  >
    <v-skeleton-loader :type="skeletonType" />
  </v-list-item>

  <v-list-item
    v-else
    :active="active"
    base-color="listItem"
    :border="active ? 'primary' : 'listItem thin'"
    class="mt-2 mx-2"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': active
        ? primaryColor + ' !important'
        : isDark ? '#686868 !important' : '#ABABAB !important',
    }"
    variant="tonal"
    @click="emit('click')"
  >
    <div class="d-flex w-100 ga-2">
      <div class="flex-grow-1 align-self-center" style="min-width: 0">
        <slot />
      </div>

      <div v-if="$slots.action" class="flex-shrink-0 align-self-start">
        <slot name="action" />
      </div>
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
  import { useTheme } from 'vuetify'

  defineProps<{ loading?: boolean, active?: boolean, skeletonType?: string }>()
  const emit = defineEmits<{ (e: 'click'): void }>()

  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
</script>
