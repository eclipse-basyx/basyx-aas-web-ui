<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <!-- Operation variable: bordered container with badge, name AND input inside -->
            <div
                v-if="isOperationVariable"
                class="d-flex align-center gap-8 px-3 py-2"
                style="border: 1px solid #cccccc; border-radius: 4px;">
                <v-chip label size="small" color="#fb8c00" text-color="#ffffff" variant="flat" class="font-weight-bold flex-shrink-0">
                    {{ stringValue.valueType }}
                </v-chip>
                <span class="text-body-2 font-weight-bold flex-shrink-0" style="color: #999;">
                    {{ stringValue.idShort }}
                </span>
                <v-text-field
                    v-model="newStringValue"
                    variant="outlined"
                    density="compact"
                    class="flex-grow-1"
                    :readonly="isOutputVariable || !isEditable"
                    :hide-details="true"
                    auto-grow
                    :rows="1"
                    @keydown.enter="updateValue()"
                    @update:focused="setFocus(!isFocused)"
                    @update:model-value="setFocus(true)">
                </v-text-field>
            </div>
            <!-- Non-operation variable: original layout -->
            <v-text-field
                v-else
                v-model="newStringValue"
                variant="outlined"
                density="compact"
                :clearable="(isFocused || stringValue.value != newStringValue) && isEditable"
                :readonly="isOutputVariable || !isEditable"
                :hint="stringValue.value == newStringValue ? '' : 'Current value not yet saved.'"
                auto-grow
                :rows="1"
                :hide-details="false"
                :focused="isFocused"
                @keydown.enter="updateValue()"
                @update:focused="setFocus(!isFocused)"
                @update:model-value="setFocus(true)">
                <template #append-inner>
                    <v-btn
                        v-if="(isFocused || stringValue.value != newStringValue) && isEditable"
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
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';

    const aasStore = useAASStore();
    const { patchRequest } = useRequestHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    const props = defineProps({
        stringValue: {
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
        (event: 'updateValue', updatedStringValue: any): void;
    }>();

    const newStringValue = ref<string>('');
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
                newStringValue.value = props.stringValue.value;
            } else {
                newStringValue.value = '';
            }
            setFocus(false);
        }
    );

    watch(
        () => props.stringValue,
        (propsStringValue) => {
            newStringValue.value = propsStringValue.value;
        },
        { deep: true }
    );

    onMounted(() => {
        newStringValue.value = props.stringValue.value;
    });

    function updateValue(): void {
        if (isOperationVariable.value) {
            emit('updateValue', newStringValue.value);
            return;
        }
        const path = `${props.stringValue.path}/$value`;
        const content = JSON.stringify(newStringValue.value);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const context = `updating ${props.stringValue.modelType} "${props.stringValue.idShort}"`;
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
        if (!isFocusedToSet) newStringValue.value = props.stringValue.value;
    }
</script>
