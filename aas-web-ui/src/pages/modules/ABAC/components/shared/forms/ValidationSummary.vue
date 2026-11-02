<template>
  <v-alert
    class="mt-4 pa-0"
    density="compact"
    :icon="false"
    :role="advisory ? 'status' : 'alert'"
    :type="advisory ? 'warning' : 'error'"
    variant="tonal"
  >
    <div class="d-flex align-center ga-2 px-6 pt-4 text-body-large">
      <span>{{ advisory ? t('forms.validation.advisoryTitle') : error.title }}</span>
      <v-icon :icon="advisory ? ICONS.WARNING : ICONS.ERROR" size="small" />
    </div>

    <p v-if="advisory" class="px-6 mb-2 text-body-small">{{ t('forms.validation.advisoryHint') }}</p>

    <div v-if="error.messages?.length" class="px-6 pb-4 text-body-medium">
      <ul class="pl-4">
        <li v-for="(message, index) in visibleMessages" :key="index">{{ message }}</li>
      </ul>

      <v-expansion-panels v-if="advisory" class="mt-3" flat>
        <v-expansion-panel bg-color="transparent" elevation="0">
          <v-expansion-panel-title
            class="pa-0 text-body-medium"
            :collapse-icon="ICONS.COLLAPSE"
            :expand-icon="ICONS.EXPAND"
            min-height="32"
          >
            {{ t('forms.validation.technicalDetails') }}
          </v-expansion-panel-title>

          <v-expansion-panel-text class="validation-technical-details">
            <ul class="pl-4">
              <li v-for="(message, index) in error.messages" :key="index">{{ message }}</li>
            </ul>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-alert>
</template>

<script setup lang="ts">
  import type { JsonErrorMessage } from '../../../types/json'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'

  const ICONS = {
    EXPAND: 'mdi-chevron-down',
    COLLAPSE: 'mdi-chevron-up',
    ERROR: 'mdi-alert-circle',
    WARNING: 'mdi-alert',
  } as const

  const { error, advisory } = defineProps<{ error: JsonErrorMessage, advisory?: boolean }>()

  const { t } = useAbacI18n()
  const visibleMessages = computed(() => advisory ? (error.summary ?? error.messages?.slice(0, 3)) : error.messages)
</script>

<style scoped>
  .validation-technical-details :deep(.v-expansion-panel-text__wrapper) {
    padding: 0;
  }
</style>
