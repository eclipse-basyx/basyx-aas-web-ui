<template>
  <v-card border flat>
    <v-card-title class="d-flex align-center flex-wrap ga-2">
      Access settings
      <v-chip class="ml-2" :color="localPolicy ? 'primary' : 'info'" size="small">
        {{ localPolicy ? 'Not inheriting rules' : 'Inheriting rules' }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle v-if="!localPolicy && effectivePolicy" class="text-wrap text-break">
      Access rules are inherited from the parent resource. Changes to the parent also apply here.
    </v-card-subtitle>

    <v-card-text>
      <v-alert v-if="!effectivePolicy" class="mb-4" type="warning" variant="tonal">
        No effective policy is available for this resource.
      </v-alert>

      <v-expansion-panels>
        <v-expansion-panel title="Technical policy editor (JSON)">
          <v-expansion-panel-text>
            <v-alert class="mb-3" density="compact" type="info" variant="tonal">
              RESOURCE is bound to this endpoint and cannot be changed.
            </v-alert>

            <CodeEditor
              v-model="source"
              accessible-label="Resource-bound policy"
              :error="Boolean(validationMessage)"
              height="320px"
              language="json"
              model-namespace="resource-access-policy"
              :options="{ wordWrap: 'on' }"
              :read-only="loading"
            />

            <v-alert
              v-if="validationMessage"
              class="mt-2"
              density="compact"
              role="alert"
              type="error"
              variant="tonal"
            >
              {{ validationMessage }}
            </v-alert>

            <div class="d-flex justify-end mt-3">
              <v-btn color="primary" :disabled="loading || !source.trim()" :loading="loading" @click="saveJson">
                Save JSON policy
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <v-card-actions>
      <v-btn
        v-if="localPolicy"
        class="text-wrap h-auto py-2"
        color="error"
        :disabled="loading"
        prepend-icon="mdi-source-branch-remove"
        variant="text"
        @click="$emit('request-delete')"
      >Inherit access rules</v-btn>

      <v-btn
        v-else
        class="text-wrap h-auto py-2"
        color="primary"
        :disabled="loading"
        prepend-icon="mdi-source-branch-plus"
        variant="tonal"
        @click="$emit('request-localize')"
      >Do not inherit access rules</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import type { ResourceBoundPolicy, ResourceObject } from '@/types/ResourceAccess'
  import { validatePolicyJson } from '@/utils/ResourceAccessValidation'

  const props = defineProps<{
    resource: ResourceObject
    localPolicy: ResourceBoundPolicy | null
    effectivePolicy: ResourceBoundPolicy | null
    loading?: boolean
  }>()

  const emit = defineEmits<{
    'save': [policy: ResourceBoundPolicy]
    'request-delete': []
    'request-localize': []
  }>()

  const source = ref('')
  const validationMessage = ref('')

  watch(
    () => [props.localPolicy, props.effectivePolicy],
    () => {
      source.value = JSON.stringify(props.localPolicy ?? props.effectivePolicy ?? {
        RESOURCE: props.resource,
        rules: [],
      }, null, 2)
      validationMessage.value = ''
    },
    { deep: true, immediate: true },
  )

  function saveJson (): void {
    if (props.loading) return
    const result = validatePolicyJson(source.value, props.resource)
    validationMessage.value = result.message ?? ''
    if (result.valid && result.policy) emit('save', result.policy)
  }
</script>
