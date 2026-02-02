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
    import { getDataTypes } from '@/composables/AAS/DataTypeHandling';

    // Type Map for supported types
    type ValueMap = {
        category: string;
        assetKind: aasTypes.AssetKind;
        modellingKind: aasTypes.ModellingKind;
        dataType: aasTypes.DataTypeDefXsd;
        elementType: aasTypes.AasSubmodelElements;
        entityType: aasTypes.EntityType;
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

    const selectedValue = ref<ValueType<typeof props.type> | null>(props.modelValue);

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
            case 'dataType':
                return getDataTypes();
            case 'elementType':
                return [
                    {
                        title: 'SubmodelElementCollection',
                        value: aasTypes.AasSubmodelElements.SubmodelElementCollection,
                    },
                    { title: 'SubmodelElementList', value: aasTypes.AasSubmodelElements.SubmodelElementList },
                    { title: 'Property', value: aasTypes.AasSubmodelElements.Property },
                    { title: 'MultiLanguageProperty', value: aasTypes.AasSubmodelElements.MultiLanguageProperty },
                    { title: 'Range', value: aasTypes.AasSubmodelElements.Range },
                    { title: 'File', value: aasTypes.AasSubmodelElements.File },
                    { title: 'Blob', value: aasTypes.AasSubmodelElements.Blob },
                    { title: 'ReferenceElement', value: aasTypes.AasSubmodelElements.ReferenceElement },
                    { title: 'RelationshipElement', value: aasTypes.AasSubmodelElements.RelationshipElement },
                    {
                        title: 'AnnotatedRelationshipElement',
                        value: aasTypes.AasSubmodelElements.AnnotatedRelationshipElement,
                    },
                    { title: 'Entity', value: aasTypes.AasSubmodelElements.Entity },
                    { title: 'EventElement', value: aasTypes.AasSubmodelElements.EventElement },
                    { title: 'BasicEventElement', value: aasTypes.AasSubmodelElements.BasicEventElement },
                    { title: 'Operation', value: aasTypes.AasSubmodelElements.Operation },
                    { title: 'Capability', value: aasTypes.AasSubmodelElements.Capability },
                    { title: 'DataElement', value: aasTypes.AasSubmodelElements.DataElement },
                    { title: 'SubmodelElement', value: aasTypes.AasSubmodelElements.SubmodelElement },
                ];
            case 'entityType':
                return [
                    { title: 'Co-Managed Entity', value: aasTypes.EntityType.CoManagedEntity },
                    { title: 'Self-Managed Entity', value: aasTypes.EntityType.SelfManagedEntity },
                ];
            default:
                return [];
        }
    });

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
