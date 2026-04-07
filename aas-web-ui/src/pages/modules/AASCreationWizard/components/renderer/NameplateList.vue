<template>
    <v-card variant="outlined" class="pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
            <div>
                <div class="text-subtitle-1 font-weight-medium">
                    {{ formatLabel(element.idShort) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                    {{ items.length }} item<span v-if="items.length !== 1">s</span>
                </div>
            </div>

            <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="onAddItem"> Add new </v-btn>
        </div>

        <div v-if="items.length === 0" class="text-body-2 text-medium-emphasis">No entries added yet.</div>

        <v-expansion-panels v-else v-model="openPanels" multiple variant="accordion" class="ga-3">
            <v-expansion-panel v-for="(item, index) in items" :key="`${element.idShort}-${index}`" :value="index">
                <v-expansion-panel-title>
                    <div class="d-flex justify-space-between align-center w-100 pr-2">
                        <div class="text-subtitle-2 font-weight-medium">
                            {{ formatLabel(element.idShort) }} {{ index + 1 }}
                        </div>

                        <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click.stop="onRemoveItem(index)">
                            Remove
                        </v-btn>
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <NameplateRenderer
                        v-if="itemTemplate"
                        :elements="itemTemplate.value"
                        :form-state="item"
                        @update:form-state="onUpdateItem(index, $event)" />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-card>
</template>

<script lang="ts" setup>
    import type { FormStateObject, FormStateValue } from '../../types/form';
    import type { SubmodelElementListElement } from '../../types/template';
    import { computed, ref } from 'vue';
    import { asFormStateObjectArray, formatLabel } from '../../utils/formFieldUtils';
    import {
        addopenPanelIndex,
        appendListItem,
        createSubmodelListTemplate,
        getListItemCollectionTemplate,
        removeAndReindexOpenPanels,
        removeListItem,
        updateListItem,
    } from '../../utils/subModelListUtils';
    import NameplateRenderer from './NamePlateRenderer.vue';

    const props = defineProps<{
        element: SubmodelElementListElement;
        modelValue: FormStateValue;
    }>();

    const emit = defineEmits<{
        (e: 'update:modelValue', value: FormStateObject[]): void;
    }>();

    const openPanels = ref<number[]>([]);

    const items = computed<FormStateObject[]>(() => {
        return asFormStateObjectArray(props.modelValue);
    });

    const itemTemplate = computed(() => {
        return getListItemCollectionTemplate(props.element);
    });

    function onAddItem(): void {
        const newItem = createSubmodelListTemplate(props.element);
        const updated = appendListItem(items.value, newItem);
        emit('update:modelValue', updated);

        const newIndex = updated.length - 1;
        // openPanels.value = [...openPanels.value, newIndex];
        openPanels.value = addopenPanelIndex(openPanels.value, newIndex);
    }

    function onRemoveItem(index: number): void {
        // const updated = [...items.value];
        // updated.splice(index, 1);
        const updated = removeListItem(items.value, index);
        emit('update:modelValue', updated);

        openPanels.value = removeAndReindexOpenPanels(openPanels.value, index);
    }

    function onUpdateItem(index: number, value: FormStateObject): void {
        const updated = updateListItem(items.value, index, value);
        emit('update:modelValue', updated);
    }
</script>
