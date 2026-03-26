<template>
    <FormField :label="formatLabel(element.idShort)">
        <!-- Property -->
        <v-text-field
            v-if="checkTemplateFields.isPropertyElement(element)"
            :model-value="propertyValue"
            :type="propertyInputType"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            @update:model-value="onPropertyInput" />
        <!-- MultiLanguageProperty -->
        <div v-else-if="checkTemplateFields.isMultiLanguagePropertyElement(element)" class="d-flex flex-column ga-3">
            <v-row
                v-for="(entry, index) in multiLanguageValue"
                :key="`$element.idShort}-${index}`"
                class="align-center">
                <v-col cols="4">
                    <v-text-field
                        :model-value="entry.language"
                        label="Language"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        @update:model-value="onLanguageChange(index, $event)" />
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        :model-value="entry.text"
                        label="Text"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        @update:model-value="onTextChange(index, $event)" />
                </v-col>
                <v-col cols="2" class="d-flex justify-end">
                    <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        :disabled="multiLanguageValue.length === 1"
                        @click="onRemoveTranslation(index)" />
                </v-col>
            </v-row>
            <div>
                <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="onAddTranslation">
                    Add translation
                </v-btn>
            </div>
        </div>
        <!-- file -->
        <v-file-input
            v-else-if="checkTemplateFields.isFileElement(element)"
            :model-value="fileValue"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            @update:model-value="onFileInput" />
    </FormField>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { FormStateValue } from '../../types/form';
    import { TemplateElement } from '../../types/template';
    import * as checkTemplateFields from '../../utils/checkTemplateFields';
    import { asFile, asLangStrings, asString, formatLabel } from '../../utils/formFieldUtils';
    import {
        addLangStringRow,
        removeLangStringRow,
        updateLangStringLanguage,
        updateLangStringText,
    } from '../../utils/langStringFormUtils';
    import { getPropertyInputType } from '../../utils/propertyInputUtils';
    import FormField from '../FormField.vue';

    const props = defineProps<{
        element: TemplateElement;
        modelValue: FormStateValue;
    }>();

    const emit = defineEmits<{
        (e: 'update:modelValue', value: FormStateValue): void;
    }>();

    const propertyValue = computed<string>(() => {
        return asString(props.modelValue);
    });

    const multiLanguageValue = computed(() => {
        return asLangStrings(props.modelValue);
    });

    const fileValue = computed<File | null>(() => {
        return asFile(props.modelValue);
    });

    const propertyInputType = computed<string>(() => {
        if (!checkTemplateFields.isPropertyElement(props.element)) {
            return 'text';
        }

        return getPropertyInputType(props.element);
    });

    function onPropertyInput(value: string | null): void {
        emit('update:modelValue', value ?? '');
    }

    function onAddTranslation(): void {
        emit('update:modelValue', addLangStringRow(multiLanguageValue.value));
    }

    function onRemoveTranslation(index: number): void {
        emit('update:modelValue', removeLangStringRow(multiLanguageValue.value, index));
    }

    function onLanguageChange(index: number, value: string | null): void {
        emit('update:modelValue', updateLangStringLanguage(multiLanguageValue.value, index, value ?? ''));
    }

    function onTextChange(index: number, value: string | null): void {
        emit('update:modelValue', updateLangStringText(multiLanguageValue.value, index, value ?? ''));
    }

    function onFileInput(value: File | File[] | null): void {
        if (Array.isArray(value)) {
            emit('update:modelValue', value[0] ?? null);
            return;
        }

        emit('update:modelValue', value ?? null);
    }
</script>
