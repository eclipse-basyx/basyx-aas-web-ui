<template>
    <v-expansion-panels v-model="localExpandedPanels" multiple>
        <v-expansion-panel v-for="(componentKey, index) in BASYX_COMPONENT_KEYS" :key="componentKey" :value="index">
            <v-expansion-panel-title>
                <div class="d-flex align-center">
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
                        size="small"
                        class="mr-2">
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
                    <span>{{ getComponentLabel(componentKey) }}</span>
                </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
                <!-- Component URL -->
                <v-text-field
                    :model-value="components[componentKey].url"
                    label="Endpoint URL"
                    variant="outlined"
                    density="compact"
                    placeholder="https://example.com/api"
                    class="mb-2"
                    @update:model-value="handleUrlUpdate(componentKey, $event)"
                    @keyup.enter="$emit('test-connection', componentKey)">
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
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script lang="ts" setup>
    import type { BaSyxComponentKey } from '@/types/BaSyx';
    import type {
        ComponentConnectionStatus,
        ComponentTestingLoading,
        InfrastructureConfig,
    } from '@/types/Infrastructure';
    import { computed } from 'vue';
    import { BASYX_COMPONENT_KEYS, getComponentLabel } from '@/utils/InfrastructureUtils';

    // Props
    const props = defineProps<{
        components: InfrastructureConfig['components'];
        componentConnectionStatus: ComponentConnectionStatus;
        componentTestingLoading: ComponentTestingLoading;
        expandedPanels: number[];
    }>();

    // Emits
    const emit = defineEmits<{
        'test-connection': [componentKey: BaSyxComponentKey];
        'update:expandedPanels': [value: number[]];
        'update:componentUrl': [componentKey: BaSyxComponentKey, url: string];
        'update:connectionStatus': [componentKey: BaSyxComponentKey, status: boolean | null];
    }>();

    // Local computed for v-model
    const localExpandedPanels = computed({
        get: () => props.expandedPanels,
        set: (value: number[]) => emit('update:expandedPanels', value),
    });

    function handleUrlUpdate(componentKey: BaSyxComponentKey, url: string): void {
        emit('update:componentUrl', componentKey, url);
        emit('update:connectionStatus', componentKey, null);
    }
</script>
