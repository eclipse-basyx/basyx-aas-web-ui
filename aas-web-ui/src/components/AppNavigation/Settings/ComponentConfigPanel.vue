<template>
  <v-container class="pa-0">
    <div v-for="endpointField in endpointFields" :key="endpointField.key" class="mb-2">
      <v-text-field
        autocomplete="url"
        density="compact"
        :label="endpointField.label + ' Endpoint URL'"
        :model-value="getEndpointFieldValue(components, endpointField)"
        :name="`basyx-${endpointField.key}-endpoint`"
        placeholder="https://example.com/api"
        variant="outlined"
        @keyup.enter="$emit('test-connection', endpointField.key)"
        @update:model-value="handleUrlUpdate(endpointField, $event)"
      >
        <template #prepend-inner>
          <v-icon
            :color="
              getFieldConnectionStatus(endpointField) === true
                ? 'success'
                : getFieldConnectionStatus(endpointField) === false
                  ? 'error'
                  : getEndpointFieldValue(components, endpointField)
                    ? 'grey'
                    : 'grey'
            "
            size="small"
          >
            {{
              getFieldConnectionStatus(endpointField) === true
                ? 'mdi-check-circle'
                : getFieldConnectionStatus(endpointField) === false
                  ? 'mdi-alert-circle'
                  : getEndpointFieldValue(components, endpointField)
                    ? 'mdi-help-circle'
                    : 'mdi-circle-outline'
            }}
          </v-icon>
        </template>

        <template #append-inner>
          <v-btn
            :disabled="!getEndpointFieldValue(components, endpointField)"
            icon
            :loading="isFieldTesting(endpointField)"
            size="x-small"
            variant="text"
            @click.stop="$emit('test-connection', endpointField.key)"
          >
            <v-icon>mdi-connection</v-icon>
            <v-tooltip activator="parent" location="bottom"> Test Connection </v-tooltip>
          </v-btn>
        </template>
      </v-text-field>

      <template v-for="componentKey in getIntegrationComponentKeys(endpointField)" :key="componentKey">
        <v-checkbox
          v-if="componentKey === 'AASRepo' || componentKey === 'SubmodelRepo'"
          class="mt-n1 mb-1"
          density="compact"
          hide-details
          :label="getRegistryIntegrationLabel(componentKey)"
          :model-value="components[componentKey].hasRegistryIntegration ?? true"
          @update:model-value="handleRegistryIntegrationUpdate(componentKey, $event)"
        />

        <v-checkbox
          v-if="componentKey === 'AASRegistry'"
          class="mt-n1 mb-1"
          density="compact"
          hide-details
          label="Backend creates AAS discovery asset links automatically"
          :model-value="components[componentKey].hasDiscoveryIntegration ?? true"
          @update:model-value="handleDiscoveryIntegrationUpdate(componentKey, $event)"
        />
      </template>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import type { BaSyxComponentKey } from '@/types/BaSyx'
  import type {
    ComponentConnectionStatus,
    ComponentTestingLoading,
    InfrastructureConfig,
    InfrastructureTemplate,
  } from '@/types/Infrastructure'
  import type {
    InfrastructureEndpointField,
    InfrastructureEndpointFieldKey,
  } from '@/utils/InfrastructureUtils'
  import { computed } from 'vue'
  import {
    getEndpointFieldsForTemplate,
    getEndpointFieldValue,
    isComponentActiveForTemplate,
  } from '@/utils/InfrastructureUtils'

  // Props
  const props = defineProps<{
    components: InfrastructureConfig['components']
    template: InfrastructureTemplate
    componentConnectionStatus: ComponentConnectionStatus
    componentTestingLoading: ComponentTestingLoading
  }>()

  // Emits
  const emit = defineEmits<{
    'test-connection': [fieldKey: InfrastructureEndpointFieldKey]
    'update:component-url': [componentKey: BaSyxComponentKey, url: string]
    'update:connection-status': [componentKey: BaSyxComponentKey, status: boolean | null]
    'update:registry-integration': [componentKey: BaSyxComponentKey, enabled: boolean]
    'update:discovery-integration': [componentKey: BaSyxComponentKey, enabled: boolean]
  }>()

  const endpointFields = computed(() => getEndpointFieldsForTemplate(props.template))

  function handleUrlUpdate (endpointField: InfrastructureEndpointField, url: string): void {
    for (const componentKey of endpointField.componentKeys) {
      emit('update:component-url', componentKey, url)
      emit('update:connection-status', componentKey, null)
    }
  }

  function getFieldConnectionStatus (endpointField: InfrastructureEndpointField): boolean | null {
    const statuses = endpointField.componentKeys.map(key => props.componentConnectionStatus[key])

    if (statuses.every(status => status === true)) {
      return true
    }

    if (statuses.includes(false)) {
      return false
    }

    return null
  }

  function isFieldTesting (endpointField: InfrastructureEndpointField): boolean {
    return endpointField.componentKeys.some(key => props.componentTestingLoading[key])
  }

  function getIntegrationComponentKeys (endpointField: InfrastructureEndpointField): BaSyxComponentKey[] {
    return endpointField.componentKeys.filter(componentKey =>
      (componentKey === 'AASRepo' && isComponentActiveForTemplate(props.template, 'AASRegistry'))
      || (componentKey === 'SubmodelRepo' && isComponentActiveForTemplate(props.template, 'SubmodelRegistry'))
      || (componentKey === 'AASRegistry' && isComponentActiveForTemplate(props.template, 'AASDiscovery')),
    )
  }

  function getRegistryIntegrationLabel (componentKey: BaSyxComponentKey): string {
    return componentKey === 'AASRepo'
      ? 'Backend creates AAS descriptors automatically'
      : 'Backend creates Submodel descriptors automatically'
  }

  function handleRegistryIntegrationUpdate (componentKey: BaSyxComponentKey, value: boolean | null): void {
    emit('update:registry-integration', componentKey, Boolean(value))
  }

  function handleDiscoveryIntegrationUpdate (componentKey: BaSyxComponentKey, value: boolean | null): void {
    emit('update:discovery-integration', componentKey, Boolean(value))
  }
</script>
