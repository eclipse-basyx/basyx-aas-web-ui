<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <!-- Operation variable: bordered container with badge, name AND input inside -->
            <div
                v-if="isOperationVariable"
                class="d-flex align-center gap-8 px-3 py-2"
                style="border: 1px solid #cccccc; border-radius: 4px;">
                <v-chip label size="small" color="#fb8c00" text-color="#ffffff" variant="flat" class="font-weight-bold flex-shrink-0">
                    {{ numberValue.valueType }}
                </v-chip>
                <span class="text-body-2 font-weight-bold flex-shrink-0" style="color: #999;">
                    {{ numberValue.idShort }}
                </span>
                <v-text-field
                    v-model="newNumberValue"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="flex-grow-1"
                    :readonly="isOutputVariable || !isEditable"
                    :hide-details="true"
                    @keydown.enter="updateValue()"
                    @update:focused="setFocus(!isFocused)"
                    @update:model-value="setFocus(true)">
                    <template #append-inner>
                        <span class="text-subtitleText">{{ unitSuffix(numberValue) }}</span>
                    </template>
                </v-text-field>
            </div>
            <!-- Non-operation variable: original layout -->
            <v-text-field
                v-else
                v-model="newNumberValue"
                type="number"
                variant="outlined"
                density="compact"
                :clearable="(isFocused || numberValue.value != newNumberValue) && isEditable"
                :readonly="isOutputVariable || !isEditable"
                :hint="'Boxed value on the left shows the current value in the AAS'"
                :hide-details="false"
                :focused="isFocused"
                @keydown.enter="updateValue()"
                @update:focused="setFocus(!isFocused)"
                @update:model-value="setFocus(true)">
                <template #prepend-inner>
                    <v-chip
                        v-if="(isFocused || numberValue.value != newNumberValue) && isEditable"
                        label
                        size="x-small"
                        border>{{ numberValue.value }}</v-chip>
                    <v-divider
                        v-if="(isFocused || numberValue.value != newNumberValue)"
                        class="ml-3 mr-1"
                        vertical
                        inset
                        style="margin-top: 8px"></v-divider>
                </template>
                <template #append-inner>
                    <span class="text-subtitleText">{{ unitSuffix(numberValue) }}</span>
                    <v-btn
                        v-if="(isFocused || numberValue.value != newNumberValue) && isEditable"
                        size="small"
                        variant="elevated"
                        color="primary"
                        class="text-buttonText"
                        style="right: -4px"
                        @click.stop="updateValue()">
                        <v-icon>mdi-upload</v-icon>
                    </v-btn>
                </template>
            </v-text-field>
        </v-list-item-title>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';

    const aasStore = useAASStore();
    const { patchRequest } = useRequestHandling();
    const { fetchAndDispatchSme } = useSMEHandling();
    const { unitSuffix } = useConceptDescriptionHandling();

    const props = defineProps({
        numberValue: {
            type: Object,
            default: () => ({}),
        },
        isOperationVariable: {
            type: Boolean,
            default: false,
        },
        variableType: {
            type: String,
            default: 'number',
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });

    const emit = defineEmits<{
        (event: 'updateValue', updatedNumberValue: any): void;
    }>();

    const newNumberValue = ref<string>('');
    const isFocused = ref<boolean>(false);

    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });
    const isOutputVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.variableType == 'outputVariables' : false;
    });

    watch(
        () => selectedNode.value,
        (selectedNodeValue) => {
            if (selectedNodeValue && Object.keys(selectedNodeValue).length > 0) {
                newNumberValue.value = props.numberValue.value;
            } else {
                newNumberValue.value = '';
            }
            setFocus(false);
        }
    );

    watch(
        () => props.numberValue,
        (propsNumberValue) => {
            newNumberValue.value = propsNumberValue.value;
        },
        { deep: true }
    );

    onMounted(() => {
        newNumberValue.value = props.numberValue.value;
    });

    function updateValue(): void {
        if (isOperationVariable.value) {
            emit('updateValue', newNumberValue.value);
            return;
        }
        const path = `${props.numberValue.path}/$value`;
        const content = JSON.stringify(newNumberValue.value);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const context = `updating ${props.numberValue.modelType} "${props.numberValue.idShort}"`;
        const disableMessage = false;
        patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                fetchAndDispatchSme(selectedNode.value.path, false);
            }
        });
    }

    function setFocus(isFocusedToSet: boolean): void {
        if (isOperationVariable.value && !isFocusedToSet) {
            updateValue();
        }
        isFocused.value = isFocusedToSet;
        if (!isFocusedToSet) newNumberValue.value = props.numberValue.value;
    }
</script>
