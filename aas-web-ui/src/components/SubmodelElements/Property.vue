<template>
    <v-container fluid class="pa-0">
        <v-card v-if="propertyObject" color="elevatedCard">
            <!-- Value of the Property -->
            <v-list nav class="pt-5" :class="isOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- valueId -->
                <v-list-item
                    v-if="
                        !isOperationVariable &&
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
                <v-list-item v-if="!isOperationVariable && !navigationStore.getEasyViewState" class="pb-0">
                    <v-list-item-title>
                        <span class="text-caption">{{ 'Value Type: ' }}</span>
                        <v-chip label size="x-small" border color="primary">{{ propertyObject.valueType }}</v-chip>
                    </v-list-item-title>
                </v-list-item>
            <!-- Value Representation depending on the valueType -->
            
            <div class="d-flex" style="width: 100%;">
                <span v-if="easyViewState" class="mr-5 pt-3" style="font-weight: bolder">{{ nameToDisplay(propertyObject) }}</span>

                <NumberType v-if="isNumber(propertyObject.valueType)" :number-value="propertyObject"
                    :is-operation-variable="isOperationVariable" :variable-type="variableType" :is-editable="isEditable"
                    @update-value="updateValue"></NumberType>
                <BooleanType v-else-if="propertyObject.valueType == 'xs:boolean'" :boolean-value="propertyObject"
                    :is-operation-variable="isOperationVariable" :variable-type="variableType" :is-editable="isEditable"
                    @update-value="updateValue"></BooleanType>
                <DateType v-else-if="propertyObject.valueType == 'xs:date'" :date-value="propertyObject"
                    :is-operation-variable="isOperationVariable" :variable-type="variableType" :is-editable="isEditable"
                    @update-value="updateValue"></DateType>
                <DateTimeStampType v-else-if="propertyObject.valueType == 'xs:dateTime'"
                    :date-time-stamp-value="propertyObject" :is-operation-variable="isOperationVariable"
                    :variable-type="variableType" :is-editable="isEditable" @update-value="updateValue">
                </DateTimeStampType>
                <StringType v-else :string-value="propertyObject" :is-operation-variable="isOperationVariable"
                    :variable-type="variableType" :is-editable="isEditable" @update-value="updateValue"></StringType>
            </div>
            
        </v-list></v-card>

    </v-container>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { isNumber } from '@/utils/generalUtils';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const navigationStore = useNavigationStore();
    const easyViewState = computed(() => navigationStore.getEasyViewState)

    const { nameToDisplay } = useReferableUtils();

    const props = defineProps({
        propertyObject: {
            type: Object,
            default: () => ({}),
        },
        isOperationVariable: {
            type: Boolean,
            default: false,
        },
        variableType: {
            type: String,
            default: 'string',
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });

    const emit = defineEmits<{
        (e: 'updateValue', updatedPropertyObject: any): void;
    }>();

    const isOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });

    function updateValue(updatedPropertyObject: any): void {
        emit('updateValue', updatedPropertyObject);
    }
</script>
