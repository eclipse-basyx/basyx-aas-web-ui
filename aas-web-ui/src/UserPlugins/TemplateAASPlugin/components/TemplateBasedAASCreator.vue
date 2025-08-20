<template>
    <v-dialog v-model="dialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtitle-1">Create AAS from Template: {{ template?.name }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-stepper v-model="currentStep" class="bg-card">
                    <v-stepper-header>
                        <v-stepper-item value="1" :complete="currentStep > 1"> Basic Information </v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item value="2" :complete="currentStep > 2"> Review </v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item value="3"> Create </v-stepper-item>
                    </v-stepper-header>

                    <v-stepper-window>
                        <v-stepper-window-item value="1">
                            <v-card class="mb-4" elevation="0">
                                <v-card-text>
                                    <TextInput
                                        v-model="idShort"
                                        label="ID Short"
                                        :rules="[(v: string) => !!v || 'ID Short is required']"
                                        required />
                                    <MultiLanguageTextInput
                                        v-model="displayName"
                                        :show-label="true"
                                        label="Display Name"
                                        type="displayName" />
                                    <MultiLanguageTextInput
                                        v-model="description"
                                        :show-label="true"
                                        label="Description"
                                        type="description" />
                                </v-card-text>
                            </v-card>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" :disabled="!isBasicInfoValid" @click="goToReview"> Next </v-btn>
                            </v-card-actions>
                        </v-stepper-window-item>

                        <v-stepper-window-item value="2">
                            <v-card class="mb-4" elevation="0">
                                <v-card-text>
                                    <div class="text-subtitle-1 mb-2">Review Information</div>
                                    <v-list>
                                        <v-list-item>
                                            <template #prepend>
                                                <v-icon icon="mdi-identifier"></v-icon>
                                            </template>
                                            <v-list-item-title>ID Short</v-list-item-title>
                                            <v-list-item-subtitle>{{ idShort }}</v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item v-if="displayName && displayName.length > 0">
                                            <template #prepend>
                                                <v-icon icon="mdi-tag-text"></v-icon>
                                            </template>
                                            <v-list-item-title>Display Name</v-list-item-title>
                                            <v-list-item-subtitle>
                                                <div v-for="name in displayName" :key="name.language">
                                                    {{ name.language }}: {{ name.text }}
                                                </div>
                                            </v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item v-if="description && description.length > 0">
                                            <template #prepend>
                                                <v-icon icon="mdi-text"></v-icon>
                                            </template>
                                            <v-list-item-title>Description</v-list-item-title>
                                            <v-list-item-subtitle>
                                                <div v-for="desc in description" :key="desc.language">
                                                    {{ desc.language }}: {{ desc.text }}
                                                </div>
                                            </v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template #prepend>
                                                <v-icon icon="mdi-shape"></v-icon>
                                            </template>
                                            <v-list-item-title>Category</v-list-item-title>
                                            <v-list-item-subtitle>{{
                                                template?.category || 'None'
                                            }}</v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template #prepend>
                                                <v-icon icon="mdi-file-document"></v-icon>
                                            </template>
                                            <v-list-item-title>Template</v-list-item-title>
                                            <v-list-item-subtitle
                                                >{{ template?.name }} (v{{ template?.version }})</v-list-item-subtitle
                                            >
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                            </v-card>
                            <v-card-actions>
                                <v-btn @click="goBack">Back</v-btn>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="createAAS">Create AAS</v-btn>
                            </v-card-actions>
                        </v-stepper-window-item>

                        <v-stepper-window-item value="3">
                            <v-card class="mb-4" elevation="0">
                                <v-card-text>
                                    <div v-if="creationSuccess" class="text-success">
                                        <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                                        Successfully created AAS from template.
                                    </div>
                                    <div v-if="creationError" class="text-error">
                                        <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
                                        Error creating AAS: {{ creationError }}
                                    </div>
                                </v-card-text>
                            </v-card>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="closeDialog">Close</v-btn>
                            </v-card-actions>
                        </v-stepper-window-item>
                    </v-stepper-window>
                </v-stepper>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import MultiLanguageTextInput from '@/components/EditorComponents/InputTypes/MultiLanguageTextInput.vue';
    //import SelectInput from '@/components/EditorComponents/InputTypes/SelectInput.vue';
    import TextInput from '@/components/EditorComponents/InputTypes/TextInput.vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { TemplateBasedAASCreator } from '@/UserPlugins/TemplateAASPlugin/services/TemplateBasedAASCreator';
    import { AASTemplate } from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';

    const props = defineProps<{
        template: AASTemplate | null;
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void;
        (e: 'created', aasId: string): void;
    }>();

    const router = useRouter();
    const navigationStore = useNavigationStore();
    const aasHandling = useAASHandling();
    const aasStore = useAASStore();

    const dialog = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    });

    const currentStep = ref(1);
    const idShort = ref('');
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const creationSuccess = ref(false);
    const creationError = ref('');

    const isBasicInfoValid = computed(() => {
        return !!idShort.value;
    });

    // Watch for template changes to set defaults
    watch(
        () => props.template,
        (newTemplate) => {
            if (newTemplate?.defaults) {
                // Only set defaults if values are not already set by user
                if (!idShort.value) {
                    idShort.value = newTemplate.defaults.idShort || '';
                }
                if (!displayName.value && newTemplate.defaults.displayName) {
                    displayName.value = newTemplate.defaults.displayName.map(
                        (d: { language: string; text: string }) => new aasTypes.LangStringNameType(d.language, d.text)
                    );
                }
                if (!description.value && newTemplate.defaults.description) {
                    description.value = newTemplate.defaults.description.map(
                        (d: { language: string; text: string }) => new aasTypes.LangStringTextType(d.language, d.text)
                    );
                }
            }
        },
        { immediate: true }
    );

    // Watch for dialog opening to reset state
    watch(
        () => dialog.value,
        (newValue) => {
            if (newValue) {
                // Always start at step 1 when dialog opens
                currentStep.value = 1;

                // Reset form values
                idShort.value = '';
                displayName.value = null;
                description.value = null;

                // Then apply template defaults if available
                if (props.template?.defaults) {
                    idShort.value = props.template.defaults.idShort || '';
                    if (props.template.defaults.displayName) {
                        displayName.value = props.template.defaults.displayName.map(
                            (d: { language: string; text: string }) =>
                                new aasTypes.LangStringNameType(d.language, d.text)
                        );
                    }
                    if (props.template.defaults.description) {
                        description.value = props.template.defaults.description.map(
                            (d: { language: string; text: string }) =>
                                new aasTypes.LangStringTextType(d.language, d.text)
                        );
                    }
                }

                creationSuccess.value = false;
                creationError.value = '';
            }
        }
    );

    // Add watch for currentStep to prevent skipping steps
    watch(
        () => currentStep.value,
        (newStep, oldStep) => {
            // Prevent skipping to review without valid info
            if (newStep === 2 && !isBasicInfoValid.value) {
                currentStep.value = 1;
            }
            // Prevent skipping to creation step
            if (newStep === 3 && oldStep !== 2) {
                currentStep.value = oldStep;
            }
        }
    );

    function goToReview(): void {
        if (isBasicInfoValid.value) {
            currentStep.value = 2;
        }
    }

    function goBack(): void {
        if (currentStep.value > 1) {
            currentStep.value--;
        }
    }

    const creator = new TemplateBasedAASCreator();

    async function createAAS(): Promise<void> {
        if (!props.template) return;

        try {
            const result = await creator.createFromTemplate(props.template, {
                idShort: idShort.value,
                displayName: displayName.value || undefined,
                description: description.value || undefined,
            });

            if (!result.success || !result.aas || !result.aasId) {
                throw new Error(result.errors?.join(', ') || 'Failed to create AAS');
            }

            // Navigate to the new AAS
            const aasEndpoint = await aasHandling.getAasEndpointById(result.aasId);
            router.push({ query: { aas: aasEndpoint } });

            // Update stores
            navigationStore.dispatchTriggerAASListReload();
            aasStore.dispatchSelectedAAS(result.aas);

            creationSuccess.value = true;
            currentStep.value = 3;
            emit('created', result.aasId);
        } catch (error) {
            console.error('Error creating AAS:', error);
            creationError.value = error instanceof Error ? error.message : 'Unknown error occurred';
            currentStep.value = 3;
        }
    }

    function closeDialog(): void {
        dialog.value = false;
    }
</script>

<style scoped>
    .v-stepper {
        background: transparent !important;
    }
    .text-success {
        color: rgb(var(--v-theme-success));
    }
    .text-error {
        color: rgb(var(--v-theme-error));
    }
</style>
