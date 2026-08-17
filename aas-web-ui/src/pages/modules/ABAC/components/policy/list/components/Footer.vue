<script setup lang="ts">
  import AbacConfigurator from '@/pages/modules/ABAC/components/config/AbacConfigurator.vue'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import ServiceSelector from './ServiceSelector.vue'

  const ICONS = {
    COLLAPSE: 'mdi-chevron-double-left',
  } as const

  const emit = defineEmits<{ collapse: [] }>()

  const { t, i18nData } = useAbacI18n()
</script>

<template>
  <div>
    <v-divider />

    <div class="d-flex align-center flex-row justify-space-between py-2 px-2">
      <v-btn
        density="comfortable"
        :icon="ICONS.COLLAPSE"
        size="small"
        variant="text"
        v-bind="i18nData('policies.list.collapseList')"
        @click="emit('collapse')"
      >
        <v-icon>{{ ICONS.COLLAPSE }}</v-icon>

        <v-tooltip activator="parent" location="bottom" :open-delay="600">
          {{ t('policies.list.collapseList') }}
        </v-tooltip>
      </v-btn>

      <ServiceSelector />
      <AbacConfigurator />
    </div>
  </div>
</template>
