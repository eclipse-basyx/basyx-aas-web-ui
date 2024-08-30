<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="!IsOperationVariable" class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Value: ' }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="propertyObject" color="elevatedCard">
            <!-- Value of the Property -->
            <v-list nav class="pt-0" :class="IsOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- valueId -->
                <v-list-item
                    v-if="
                        !IsOperationVariable &&
                        propertyObject.valueId &&
                        propertyObject.valueId.keys &&
                        propertyObject.valueId.keys.length > 0
                    "
                    class="pb-0">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(valueId, i) in propertyObject.valueId.keys" :key="i" class="text-caption">
                            <span class="font-weight-bold">{{ '(' + valueId.type + ') ' }}</span>
                            {{ valueId.value }}
                        </div>
                    </v-tooltip>
                    <template #title>
                        <span class="text-caption">{{ 'ValueId: ' }}</span>
                    </template>
                    <template #subtitle>
                        <v-list-item-subtitle v-for="(valueId, i) in propertyObject.valueId.keys" :key="i">
                            <div class="pt-2">
                                <v-chip label size="x-small" border class="mr-2">{{ valueId.type }}</v-chip>
                                <span>{{ valueId.value }}</span>
                            </div>
                        </v-list-item-subtitle>
                    </template>
                </v-list-item>
                <!-- valueType -->
                <v-list-item v-if="!IsOperationVariable" class="pb-0">
                    <v-list-item-title>
                        <span class="text-caption">{{ 'Value Type: ' }}</span>
                        <v-chip label size="x-small" border color="primary">{{ propertyObject.valueType }}</v-chip>
                    </v-list-item-title>
                </v-list-item>
                <!-- Value Representation depending on the valueType -->
                <NumberType
                    v-if="isNumber(propertyObject.valueType)"
                    :number-value="propertyObject"
                    :is-operation-variable="isOperationVariable"
                    :variable-type="variableType"
                    @update-value="updateValue"></NumberType>
                <BooleanType
                    v-else-if="propertyObject.valueType == 'xs:boolean'"
                    :boolean-value="propertyObject"
                    :is-operation-variable="isOperationVariable"
                    :variable-type="variableType"
                    @update-value="updateValue"></BooleanType>
                <DateTimeStampType
                    v-else-if="propertyObject.valueType == 'xs:dateTime'"
                    :date-time-stamp-value="propertyObject"
                    :is-operation-variable="isOperationVariable"
                    :variable-type="variableType"
                    @update-value="updateValue"></DateTimeStampType>
                <StringType
                    v-else
                    :string-value="propertyObject"
                    :is-operation-variable="isOperationVariable"
                    :variable-type="variableType"
                    @update-value="updateValue"></StringType>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import BooleanType from './ValueTypes/BooleanType.vue';
    import DateTimeStampType from './ValueTypes/DateTimeStampType.vue';
    import NumberType from './ValueTypes/NumberType.vue';
    import StringType from './ValueTypes/StringType.vue';

    export default defineComponent({
        name: 'Property',
        components: {
            // Value Types
            StringType,
            NumberType,
            BooleanType,
            DateTimeStampType,
        },
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['propertyObject', 'isOperationVariable', 'variableType'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {};
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Check if the Property is an Operation Variable
            IsOperationVariable() {
                // check if isOperationVariable is not undefined
                if (this.isOperationVariable != undefined) {
                    return this.isOperationVariable;
                } else {
                    return false;
                }
            },
        },

        methods: {
            // Function to update the value of the property
            updateValue(updatedPropertyObject: any) {
                this.$emit('updateValue', updatedPropertyObject); // emit event to update the value in the parent component
            },
        },
    });
</script>
