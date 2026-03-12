<template>
    <v-container class="pa-0">
        <div v-for="componentKey in BASYX_COMPONENT_KEYS" :key="componentKey" class="mb-2">
            <v-text-field
                :name="`basyx-${componentKey}-endpoint`"
                :model-value="components[componentKey].url"
                :label="getComponentLabel(componentKey) + ' Endpoint URL'"
                variant="outlined"
                density="compact"
                placeholder="https://example.com/api"
                autocomplete="url"
                @update:model-value="handleUrlUpdate(componentKey, $event)"
                @keyup.enter="$emit('test-connection', componentKey)">
                <template #prepend-inner>
                    <v-icon
                        :color="
                            componentConnectionStatus[componentKey] === true
                                ? 'success'
                                : componentConnectionStatus[componentKey] === false
                                  ? 'error'
                                  : components[componentKey].url
                                    ? 'grey'
                                    : 'grey'
                        "
                        size="small">
                        {{
                            componentConnectionStatus[componentKey] === true
                                ? 'mdi-check-circle'
                                : componentConnectionStatus[componentKey] === false
                                  ? 'mdi-alert-circle'
                                  : components[componentKey].url
                                    ? 'mdi-help-circle'
                                    : 'mdi-circle-outline'
                        }}
                    </v-icon>
                </template>
                <template #append-inner>
                    <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        :loading="componentTestingLoading[componentKey]"
                        :disabled="!components[componentKey].url"
                        @click.stop="$emit('test-connection', componentKey)">
                        <v-icon>mdi-connection</v-icon>
                        <v-tooltip activator="parent" location="bottom"> Test Connection </v-tooltip>
                    </v-btn>
                </template>
            </v-text-field>

            <v-checkbox
                v-if="componentKey === 'AASRepo' || componentKey === 'SubmodelRepo'"
                :model-value="components[componentKey].hasRegistryIntegration ?? true"
                label="Backend creates descriptors automatically"
                hide-details
                density="compact"
                class="mt-n1 mb-1"
                @update:model-value="handleRegistryIntegrationUpdate(componentKey, $event)" />

            <v-checkbox
                v-if="componentKey === 'AASRegistry'"
                :model-value="components[componentKey].hasDiscoveryIntegration ?? true"
                label="Backend creates AAS discovery asset links automatically"
                hide-details
                density="compact"
                class="mt-n1 mb-1"
                @update:model-value="handleDiscoveryIntegrationUpdate(componentKey, $event)" />
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import type { BaSyxComponentKey } from '@/types/BaSyx';
    import type {
        ComponentConnectionStatus,
        ComponentTestingLoading,
        InfrastructureConfig,
    } from '@/types/Infrastructure';
    import { BASYX_COMPONENT_KEYS, getComponentLabel } from '@/utils/InfrastructureUtils';

    // Props
    defineProps<{
        components: InfrastructureConfig['components'];
        componentConnectionStatus: ComponentConnectionStatus;
        componentTestingLoading: ComponentTestingLoading;
    }>();

    // Emits
    const emit = defineEmits<{
        'test-connection': [componentKey: BaSyxComponentKey];
        'update:componentUrl': [componentKey: BaSyxComponentKey, url: string];
        'update:connectionStatus': [componentKey: BaSyxComponentKey, status: boolean | null];
        'update:registryIntegration': [componentKey: BaSyxComponentKey, enabled: boolean];
        'update:discoveryIntegration': [componentKey: BaSyxComponentKey, enabled: boolean];
    }>();

    function handleUrlUpdate(componentKey: BaSyxComponentKey, url: string): void {
        emit('update:componentUrl', componentKey, url);
        emit('update:connectionStatus', componentKey, null);
    }

    function handleRegistryIntegrationUpdate(componentKey: BaSyxComponentKey, value: boolean | null): void {
        emit('update:registryIntegration', componentKey, Boolean(value));
    }

    function handleDiscoveryIntegrationUpdate(componentKey: BaSyxComponentKey, value: boolean | null): void {
        emit('update:discoveryIntegration', componentKey, Boolean(value));
    }
</script>
