<script setup lang="ts">
  import { computed } from 'vue'
  import { useDefinitions } from '../../../hooks/useDefinitions'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import JsonCodeEditor from '../../shared/JsonCodeEditor.vue'

  const ICONS = {
    DEFINITIONS: 'mdi-book-open-variant',
  } as const

  const { t, i18nData } = useAbacI18n()

  const { selectedDefinition } = useDefinitions()

  const definitionJson = computed(() => {
    if (!selectedDefinition.value) return ''
    return JSON.stringify(selectedDefinition, null, 2)
  })
</script>

<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <template v-if="selectedDefinition">
      <v-card-title class="px-4 text-subtitle-2">
        {{ selectedDefinition.name }}
      </v-card-title>

      <v-divider />

      <v-card-text class="d-flex flex-column flex-1-1 bg-card pa-2" style="min-height: 0;">
        <JsonCodeEditor disabled :model-value="definitionJson" />
      </v-card-text>
    </template>

    <v-card-text v-else class="d-flex flex-column align-center justify-center text-grey">
      <v-icon class="mb-2" size="48">{{ ICONS.DEFINITIONS }}</v-icon>
      <div class="text-caption" v-bind="i18nData('definitions.emptyDefinition')">{{ t('definitions.emptyDefinition') }}</div>
    </v-card-text>
  </v-card>
</template>
