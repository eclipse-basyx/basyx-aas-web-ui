<template>
    <div>
        <v-radio-group v-model="selectedDefault" @update:model-value="handleDefaultChange">
            <v-table density="compact" class="border rounded">
                <thead>
                    <tr>
                        <th class="text-left">Default</th>
                        <th class="text-left">Infrastructure Name</th>
                        <th class="text-left">Configuration</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="infra in infrastructures"
                        :key="infra.id"
                        :class="{ 'bg-primary-lighten-5': infra.id === selectedInfrastructureId }">
                        <td style="width: 80px">
                            <v-radio :value="infra.id"></v-radio>
                        </td>
                        <td>
                            <div class="d-flex align-center">
                                {{ infra.name }}
                                <v-chip v-if="infra.isDefault" size="x-small" color="primary" class="ml-2"
                                    >Default</v-chip
                                >
                            </div>
                        </td>
                        <td>
                            <span class="text-caption text-medium-emphasis">{{ getInfrastructureSummary(infra) }}</span>
                        </td>
                        <td style="width: 120px">
                            <div class="d-flex justify-end">
                                <v-btn
                                    icon="mdi-pencil"
                                    size="x-small"
                                    variant="plain"
                                    @click.stop="$emit('edit', infra)">
                                </v-btn>
                                <v-btn
                                    icon="mdi-delete"
                                    size="x-small"
                                    variant="plain"
                                    class="ml-n2 mr-n2"
                                    :disabled="infrastructures.length === 1 || infra.isDefault"
                                    @click.stop="$emit('delete', infra)">
                                </v-btn>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-radio-group>

        <v-btn
            color="primary"
            block
            class="mt-4 text-buttonText"
            text="Add Infrastructure"
            prepend-icon="mdi-plus"
            @click="$emit('add')" />
    </div>
</template>

<script lang="ts" setup>
    import type { InfrastructureConfig } from '@/types/Infrastructure';
    import { computed } from 'vue';
    import { getInfrastructureSummary } from '@/utils/InfrastructureUtils';

    // Props
    const props = defineProps<{
        infrastructures: InfrastructureConfig[];
        selectedInfrastructureId: string | null;
        defaultInfrastructureId: string;
    }>();

    // Emits
    const emit = defineEmits<{
        edit: [infrastructure: InfrastructureConfig];
        delete: [infrastructure: InfrastructureConfig];
        add: [];
        'update:defaultInfrastructureId': [id: string];
    }>();

    // Local state
    const selectedDefault = computed({
        get: () => props.defaultInfrastructureId,
        set: (value: string) => emit('update:defaultInfrastructureId', value),
    });

    function handleDefaultChange(newDefaultId: string | null): void {
        if (newDefaultId) {
            emit('update:defaultInfrastructureId', newDefaultId);
        }
    }
</script>
