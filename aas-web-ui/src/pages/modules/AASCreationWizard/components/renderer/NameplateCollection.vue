<template>
    <v-card variant="outlined" class="pa-4">
        <div class="text-subtitle-1 font-weight-medium mb-3">
            {{ formatLabel(element.idShort) }}
        </div>
        <NameplateRenderer
            :elements="element.value"
            :form-state="collectionValue"
            @update:form-state="onCollectionUpdate" />
    </v-card>
</template>

<script lang="ts" setup>
    import type { SubmodelElementCollectionElement } from '../../types/template';
    import { computed } from 'vue';
    import { FormStateObject, FormStateValue } from '../../types/form';
    import { asFormStateObject, formatLabel } from '../../utils/formFieldUtils';
    import NameplateRenderer from './NamePlateRenderer.vue';

    const props = defineProps<{
        element: SubmodelElementCollectionElement;
        modelValue: FormStateValue;
    }>();

    const emit = defineEmits<{
        (e: 'update:modelValue', value: FormStateValue): void;
    }>();

    const collectionValue = computed<FormStateObject>(() => {
        return asFormStateObject(props.modelValue);
    });

    function onCollectionUpdate(value: FormStateObject): void {
        emit('update:modelValue', value);
    }
</script>
