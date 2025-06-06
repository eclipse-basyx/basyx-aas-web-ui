<template>
    <v-dialog v-model="dialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtitle-1">{{ isEditing ? 'Edit AAS' : 'Create a new AAS' }}</span>
            </v-card-title>
            <v-divider></v-divider>

            <!-- Manual Creation/Edit Step -->
            <AASForm
                v-model="showAASForm"
                :new-shell="!isEditing"
                :aas="aasToEdit"
                @created="handleManualSubmit"
                @updated="handleManualSubmit"
                @cancel="onFormCancel" />
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    //import { useRouter } from 'vue-router';
    import AASForm from '@/components/EditorComponents/AASForm.vue';
    import { AASTemplate } from '../types/templates/TemplateTypes';

    const props = defineProps<{
        modelValue: boolean;
        aas?: AASTemplate;
    }>();

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void;
        (event: 'created', aasId: string): void;
    }>();

    //const router = useRouter();

    // Dialog state
    const dialog = ref(false);
    const isEditing = ref(false);
    const aasToEdit = ref<AASTemplate | null>(null);
    const showAASForm = ref(false);

    watch(
        () => props.modelValue,
        (value) => {
            dialog.value = value;
            if (value) {
                isEditing.value = !!props.aas;
                aasToEdit.value = props.aas || null;
                showAASForm.value = true;
            }
        }
    );

    watch(
        () => dialog.value,
        (value) => {
            emit('update:modelValue', value);
            if (!value) {
                resetState();
            }
        }
    );

    function resetState(): void {
        showAASForm.value = false;
        aasToEdit.value = null;
    }

    function onFormCancel(): void {
        if (!isEditing.value) {
            showAASForm.value = false;
        }
        closeDialog();
    }

    function closeDialog(): void {
        dialog.value = false;
        resetState();
    }

    async function handleManualSubmit(): Promise<void> {
        closeDialog();
    }
</script>
