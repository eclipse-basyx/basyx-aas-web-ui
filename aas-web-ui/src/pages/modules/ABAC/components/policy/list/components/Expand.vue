<script setup lang="ts">
  import { useAbacI18n } from '../../../../i18n/useAbacI18n'

  const ICONS = {
    EXPAND: 'mdi-chevron-double-right',
  } as const

  const emit = defineEmits<{ expand: [] }>()

  const { t, i18nData } = useAbacI18n()
</script>

<template>
  <v-btn
    class="floating-expand-btn"
    density="comfortable"
    :icon="ICONS.EXPAND"
    size="small"
    variant="tonal"
    v-bind="i18nData('policies.layout.expandList')"
    @click="emit('expand')"
  >
    <v-icon>{{ ICONS.EXPAND }}</v-icon>

    <v-tooltip activator="parent" location="bottom" :open-delay="600">
      {{ t('policies.list.expandList') }}
    </v-tooltip>
  </v-btn>
</template>

<style scoped>
.floating-expand-btn {
  position: absolute;
  bottom: 48px;
  left: 12px;
  z-index: 10;
  border-radius: 50%;
}
</style>
