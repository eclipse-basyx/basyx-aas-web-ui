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
        dataType: aasTypes.DataTypeDefXsd;
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
                return [
                    { title: 'AnyUri', value: aasTypes.DataTypeDefXsd.AnyUri },
                    { title: 'Base64Binary', value: aasTypes.DataTypeDefXsd.Base64Binary },
                    { title: 'Boolean', value: aasTypes.DataTypeDefXsd.Boolean },
                    { title: 'Byte', value: aasTypes.DataTypeDefXsd.Byte },
                    { title: 'Date', value: aasTypes.DataTypeDefXsd.Date },
                    { title: 'DateTime', value: aasTypes.DataTypeDefXsd.DateTime },
                    { title: 'Decimal', value: aasTypes.DataTypeDefXsd.Decimal },
                    { title: 'Double', value: aasTypes.DataTypeDefXsd.Double },
                    { title: 'Duration', value: aasTypes.DataTypeDefXsd.Duration },
                    { title: 'Float', value: aasTypes.DataTypeDefXsd.Float },
                    { title: 'GDay', value: aasTypes.DataTypeDefXsd.GDay },
                    { title: 'GMonth', value: aasTypes.DataTypeDefXsd.GMonth },
                    { title: 'GMonthDay', value: aasTypes.DataTypeDefXsd.GMonthDay },
                    { title: 'GYear', value: aasTypes.DataTypeDefXsd.GYear },
                    { title: 'GYearMonth', value: aasTypes.DataTypeDefXsd.GYearMonth },
                    { title: 'HexBinary', value: aasTypes.DataTypeDefXsd.HexBinary },
                    { title: 'Int', value: aasTypes.DataTypeDefXsd.Int },
                    { title: 'Integer', value: aasTypes.DataTypeDefXsd.Integer },
                    { title: 'Long', value: aasTypes.DataTypeDefXsd.Long },
                    { title: 'NegativeInteger', value: aasTypes.DataTypeDefXsd.NegativeInteger },
                    { title: 'NonNegativeInteger', value: aasTypes.DataTypeDefXsd.NonNegativeInteger },
                    { title: 'NonPositiveInteger', value: aasTypes.DataTypeDefXsd.NonPositiveInteger },
                    { title: 'PositiveInteger', value: aasTypes.DataTypeDefXsd.PositiveInteger },
                    { title: 'Short', value: aasTypes.DataTypeDefXsd.Short },
                    { title: 'String', value: aasTypes.DataTypeDefXsd.String },
                    { title: 'Time', value: aasTypes.DataTypeDefXsd.Time },
                    { title: 'UnsignedByte', value: aasTypes.DataTypeDefXsd.UnsignedByte },
                    { title: 'UnsignedInt', value: aasTypes.DataTypeDefXsd.UnsignedInt },
                    { title: 'UnsignedLong', value: aasTypes.DataTypeDefXsd.UnsignedLong },
                    { title: 'UnsignedShort', value: aasTypes.DataTypeDefXsd.UnsignedShort },
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
