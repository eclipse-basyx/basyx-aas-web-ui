<template>
  <v-dialog v-model="isOpen" max-width="720" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6" v-bind="i18nData('policies.policy.validationDialog.title')">
          {{ t('policies.policy.validationDialog.title') }}
        </span>

        <v-spacer />

        <v-btn
          density="comfortable"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <div v-if="result">
          <v-alert
            class="mb-4"
            :color="result.valid ? 'success' : 'error'"
            density="compact"
            :icon="result.valid ? ICONS.VALID_CHECK : ICONS.INVALID_WARN"
            variant="tonal"
            v-bind="i18nData(`policies.policy.validationDialog.${result.valid ?'valid':'invalid'}`)"
          >
            {{ t(`policies.policy.validationDialog.${result.valid ?'valid':'invalid'}`) }}
          </v-alert>

          <v-row
            v-if="hasContent(result.materialized_policy_hash)"
            class="text-body-2 ga-2 pa-4"
          >
            <v-col class="d-flex align-center text-grey" cols="12">
              <v-icon class="mr-2" :icon="ICONS.HASH" size="small" />

              <span v-bind="i18nData('policies.policy.validationDialog.hash')">
                {{ t('policies.policy.validationDialog.hash') }}
              </span>
            </v-col>

            <v-col cols="12">
              <code class="font-monospace">{{ result.materialized_policy_hash }}</code>
            </v-col>
          </v-row>

          <div v-if="hasContent(result.error)" class="d-flex align-center mb-4">
            <v-icon class="mr-1" color="error" :icon="ICONS.INVALID_WARN" size="small" />
            <code class="font-monospace text-caption text-error">{{ result.error }}</code>
          </div>

        </div>

        <div v-else class="d-flex flex-column align-center pa-4 text-grey">
          <v-progress-circular class="mb-2" indeterminate size="24" />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="flat" v-bind="i18nData('policies.policy.validationDialog.close')" @click="close">
          {{ t('policies.policy.validationDialog.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { PolicyValidationResult } from '@/pages/modules/ABAC/types/policy'
  import { ref } from 'vue'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { hasContent } from '@/utils/StringUtils'

  const ICONS = {
    CLOSE: 'mdi-close',
    VALID_CHECK: 'mdi-check-circle-outline',
    INVALID_WARN: 'mdi-alert-circle-outline',
    HASH: 'mdi-pound',
  } as const

  const { t, i18nData } = useAbacI18n()

  const isOpen = ref(false)
  const result = ref<PolicyValidationResult | null>(null)

  function open (validationResult: PolicyValidationResult): void {
    isOpen.value = true
    result.value = validationResult
  }

  function close (): void {
    isOpen.value = false
    result.value = null
  }

  defineExpose({ open, close })
</script>
