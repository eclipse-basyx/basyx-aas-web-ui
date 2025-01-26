<template>
    <v-select
        v-model="selectedValue"
        :items="selectOptions"
        :label="label"
        variant="outlined"
        density="comfortable"
        :clearable="clearable"></v-select>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';

    // Type Map for supported types
    type ValueMap = {
        category: string;
        assetKind: aasTypes.AssetKind;
        modellingKind: aasTypes.ModellingKind;
    };

    type ValueType<T extends keyof ValueMap> = ValueMap[T];

    const props = withDefaults(
        defineProps<{
            label: string;
            type: keyof ValueMap;
            clearable?: boolean;
            modelValue: ValueType<keyof ValueMap> | null;
        }>(),
        {
            clearable: false,
        }
    );

    const emit = defineEmits<{
        (event: 'update:modelValue', value: ValueType<typeof props.type> | null): void;
    }>();

    // Data
    const selectedValue = ref<ValueType<typeof props.type> | null>(props.modelValue);

    // Computed Properties
    const selectOptions = computed(() => {
        switch (props.type) {
            case 'category':
                return [
                    { title: 'Constant', value: 'Constant' },
                    { title: 'Parameter', value: 'Parameter' },
                    { title: 'Variable', value: 'Variable' },
                ];
            case 'assetKind':
                return [
                    { title: 'Instance', value: aasTypes.AssetKind.Instance },
                    { title: 'Type', value: aasTypes.AssetKind.Type },
                    { title: 'Not Applicable', value: aasTypes.AssetKind.NotApplicable },
                ];
            case 'modellingKind':
                return [
                    { title: 'Instance', value: aasTypes.ModellingKind.Instance },
                    { title: 'Template', value: aasTypes.ModellingKind.Template },
                ];
            default:
                return [];
        }
    });

    // Watchers
    watch(selectedValue, (newValue) => {
        emit('update:modelValue', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            selectedValue.value = newValue;
        }
    );
</script>
