<template>
    <v-container fluid class="px-2 pt-2 pb-0">
        <v-list-subheader class="mb-3">Infrastructures</v-list-subheader>
        <v-select
            v-model="selectedInfraId"
            :items="infrastructureItems"
            item-title="name"
            item-value="id"
            label="Select Infrastructure"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="onInfrastructureChange">
            <template #prepend-inner>
                <v-icon :icon="connectionStatus.icon" :color="connectionStatus.color" size="x-small"></v-icon>
            </template>
            <template v-if="endpointConfigAvailable" #append>
                <v-btn icon="mdi-cog" size="small" variant="text" @click="openManageDialog">
                    <v-icon>mdi-cog</v-icon>
                    <v-tooltip activator="parent" location="bottom" :open-delay="600">Manage Infrastructures</v-tooltip>
                </v-btn>
            </template>
        </v-select>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';

    // Stores
    const infrastructureStore = useInfrastructureStore();
    const envStore = useEnvStore();

    const router = useRouter();

    // Emit
    const emit = defineEmits<{
        openManage: [];
    }>();

    // Computed Properties
    const infrastructures = computed(() => infrastructureStore.getInfrastructures);
    const basyxComponents = computed(() => infrastructureStore.getBasyxComponents);
    const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable);

    // Local State
    const selectedInfraId = ref<string | null>(infrastructureStore.getSelectedInfrastructureId);

    // Computed infrastructure items for dropdown
    const infrastructureItems = computed(() =>
        infrastructures.value.map((infra) => ({
            id: infra.id,
            name: infra.name + (infra.isDefault ? ' (Default)' : ''),
        }))
    );

    // Compute connection status based on connected components
    const connectionStatus = computed(() => {
        const components = Object.values(basyxComponents.value);
        const connectedCount = components.filter((comp) => comp.connected === true).length;
        const hasFailures = components.some((comp) => comp.connected === false);
        const hasUnknown = components.some((comp) => comp.connected === null);

        if (connectedCount === components.length) {
            return { icon: 'mdi-check-circle', color: 'success' };
        } else if (hasFailures) {
            return { icon: 'mdi-alert-circle', color: 'error' };
        } else if (hasUnknown) {
            return { icon: 'mdi-help-circle', color: 'grey' };
        } else if (connectedCount > 0) {
            return { icon: 'mdi-alert-circle', color: 'warning' };
        }
        return { icon: 'mdi-help-circle', color: 'grey' };
    });

    // Watch for external changes to selected infrastructure
    watch(
        () => infrastructureStore.getSelectedInfrastructureId,
        (newId) => {
            selectedInfraId.value = newId;
        }
    );

    // Methods
    async function onInfrastructureChange(infrastructureId: string): Promise<void> {
        // dispatchSelectInfrastructure handles connection checking and data reload internally
        await infrastructureStore.dispatchSelectInfrastructure(infrastructureId);
        router.push({
            query: {},
        });
    }

    function openManageDialog(): void {
        emit('openManage');
    }
</script>
