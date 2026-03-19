<template>
    <v-container class="py-6">
        <v-sheet border class="pa-6" rounded="lg" elevation="4">
            <v-form ref="formRef" @submit.prevent="saveAndNext">
                <v-row>
                    <v-col cols="12">
                        <div class="mb-6">
                            <div class="text-h6 font-weight-bold">Digital Nameplate</div>
                            <div class="text-body-2 text-medium-emphasis">
                                Nameplate information attached to the product
                            </div>
                        </div>
                    </v-col>
                    <v-col v-for="element in template.submodelElements" :key="element.idShort" cols="12">
                        <FormField :label="formatLabel(element.idShort)">
                            <v-text-field
                                v-if="element.modelType === 'Property' && element.valueType === 'string'"
                                v-model="formValues[element.idShort]"
                                variant="outlined"
                                density="comfortable"
                                hide-details="auto" />
                        </FormField>
                    </v-col>
                </v-row>
            </v-form>
        </v-sheet>
    </v-container>
    <div class="d-flex justify-space-between">
        <v-btn color="primary" @click="props.prev">Back</v-btn>
        <v-btn color="primary" @click="props.next">Next</v-btn>
    </div>
</template>
<script lang="ts" setup>
    import type { DigitalNameplateTemplate } from '../types/template';
    import { onMounted, reactive, ref } from 'vue';
    import { useAASCreationStore } from '../stores/aasCreationForm';
    import template from '../templates/digital-nameplate.json';
    import { formatLabel } from '../utils/formFieldUtils';
    import FormField from './FormField.vue';

    const props = defineProps<{
        next: () => void;
        prev: () => void;
        isActiveComponent: boolean;
    }>();

    const store = useAASCreationStore();
    const formRef = ref();

    const templateData = template as DigitalNameplateTemplate;

    const formValues = reactive<Record<string, string>>({});
    onMounted(() => {
        const existingData = store.digitalNameplateData ?? {};

        for (const element of templateData.submodelElements) {
            formValues[element.idShort] = existingData[element.idShort] ?? '';
        }
    });
    async function saveAndNext(): Promise<void> {
        console.log('saveAndNext clicked');
        if (!props.isActiveComponent) {
            return;
        }

        store.saveDigitalNameplateData({ ...formValues });
        props.next();
    }
</script>
