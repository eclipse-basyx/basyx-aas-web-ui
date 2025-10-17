<template>
    <v-sheet border rounded class="mt-4">
        <v-data-table-virtual
            v-model="selectedSubmodels"
            density="compact"
            :headers="headers"
            :items="submodelIds"
            style="overflow-y: auto; max-height: 300px"
            item-value="smId"
            fixed-header
            show-select>
            <template #[`header.smId`]>
                <div class="font-weight-bold">Submodel</div>
            </template>
            <template #[`item.smId`]="{ item }">
                <div>
                    {{ nameToDisplay(item.submodel) }}
                </div>
                <div class="text-medium-emphasis">
                    {{ item.smId }}
                </div>
            </template>
        </v-data-table-virtual>
    </v-sheet>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const { nameToDisplay } = useReferableUtils();

    const props = defineProps<{
        selected: string[];
        submodelIds: any[];
    }>();

    const selectedSubmodels = ref<string[]>([]);
    const headers = [{ title: 'Submodel', align: 'start', sortable: false, key: 'smId' }] as any;

    watch(
        () => selectedSubmodels.value,
        (value) => {
            emit('update:selected', value);
        }
    );

    watch(
        () => props.selected,
        (value) => {
            selectedSubmodels.value = value;
        },
        { immediate: true }
    );

    const emit = defineEmits<{
        (event: 'update:selected', value: string[]): void;
    }>();
</script>
