<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <StateView
      :empty="!selectedDefinition && !isSelectedDefinitionError && !isSelectedDefinitionLoading"
      :empty-label="t('definitions.emptyDefinition')"
      :error="isSelectedDefinitionError && !!selectedDefinitionName"
      :error-label="t('definitions.notFound')"
      :icon-empty="ICONS.DEFINITIONS"
      :icon-error="ICONS.ERROR"
      :icon-size="48"
      :loading="isSelectedDefinitionLoading"
      :loading-label="t('definitions.loading')"
    >
      <v-card-title class="pa-2 py-3 text-subtitle-2">
        {{ selectedDefinition!.name }}
      </v-card-title>

      <v-divider />

      <v-card-text class="d-flex flex-column flex-1-1 pa-0" style="min-height: 0;">
        <AbacEditor borderless :model-value="definitionJson" :target="{ mode: 'view', viewer: 'definition', kind: selectedDefinitionKind }" />
      </v-card-text>
    </StateView>
  </v-card>
</template>

<script setup lang="ts">
  import { useDefinitions } from '../../../hooks/useDefinitions'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import AbacEditor from '../../shared/AbacEditor.vue'
  import StateView from '../../shared/StateView.vue'

  const ICONS = {
    DEFINITIONS: 'mdi-book-open-variant',
    ERROR: 'mdi-alert-circle-outline',
  } as const

  const { t } = useAbacI18n()
  const { selectedDefinition, selectedDefinitionName, selectedDefinitionKind, isSelectedDefinitionLoading, isSelectedDefinitionError } = useDefinitions()

  const definitionJson = computed(() => {
    if (!selectedDefinition.value) return ''
    return JSON.stringify(selectedDefinition.value, null, 2)
  })
</script>
