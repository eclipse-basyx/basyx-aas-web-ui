<template>
    <v-dialog v-model="addSMEDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">Create new Submodel Element</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-select
                v-model="selectedSME"
                class="px-4 pt-4"
                :items="availableSMEs"
                label="Select Submodel Element Type"
                required
                variant="outlined"
                density="compact">
            </v-select>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" :disabled="selectedSME == ''" @click="openCreateSMEDialog()">Next</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { getDataElementModelTypes } from '@/utils/AAS/SubmodelElementPathUtils';

    const addSMEDialog = ref(false);

    const props = defineProps<{
        modelValue: boolean;
        parentElement?: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
        (event: 'openCreateSMEDialog', value: string): void;
    }>();

    const allSMEs = [
        'Property',
        'SubmodelElementCollection',
        'SubmodelElementList',
        'MultiLanguageProperty',
        'Range',
        'File',
        'Blob',
        'Entity',
        'ReferenceElement',
        'RelationshipElement',
        'AnnotatedRelationshipElement',
    ];

    const availableSMEs = computed(() => {
        if (props.parentElement?.modelType === 'AnnotatedRelationshipElement') {
            return getDataElementModelTypes();
        }

        return allSMEs;
    });

    const selectedSME = ref(availableSMEs.value[0] ?? '');

    watch(
        () => props.modelValue,
        (value) => {
            addSMEDialog.value = value;
        }
    );

    watch(
        () => availableSMEs.value,
        (value) => {
            if (!value.includes(selectedSME.value)) {
                selectedSME.value = value[0] ?? '';
            }
        },
        { immediate: true }
    );

    watch(
        () => addSMEDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    function closeDialog(): void {
        addSMEDialog.value = false;
    }

    function openCreateSMEDialog(): void {
        if (selectedSME.value == '') return;
        closeDialog();
        emit('openCreateSMEDialog', selectedSME.value);
    }
</script>
