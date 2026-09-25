<template>
  <v-btn
    class="floating-expand-btn"
    density="comfortable"
    :icon="ICONS.EXPAND"
    size="small"
    v-bind="i18nData('shared.expandList')"
    @click="emit('expand')"
  >
    <v-icon>{{ ICONS.EXPAND }}</v-icon>

    <v-tooltip activator="parent" location="bottom" :open-delay="600">
      {{ t('shared.expandList') }}
    </v-tooltip>
  </v-btn>
</template>

<script setup lang="ts">
  import { useAbacI18n } from '../../i18n/useAbacI18n'

  const ICONS = {
    EXPAND: 'mdi-chevron-double-right',
  } as const

  const emit = defineEmits<{ expand: [] }>()

  const { t, i18nData } = useAbacI18n()
</script>

<style scoped>
.floating-expand-btn {
  position: absolute;
  bottom: 24px;
  left: 8px;
  z-index: 10;
  border-radius: 50%;
}
</style>
