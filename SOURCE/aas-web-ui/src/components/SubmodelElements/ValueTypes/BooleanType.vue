<template>
    <v-list-item class="pt-0">
        <template #title>
            <v-switch
                v-model="newBooleanValue"
                inset
                density="compact"
                :readonly="IsOutputVariable || !isEditable"
                color="primary"
                :messages="isOperationVariable ? '' : 'greyed out text on the right shows the current value in the AAS'"
                :hide-details="IsOperationVariable ? true : false"
                @update:model-value="changeState">
                <template #label>
                    <span style="display: inline; white-space: nowrap" class="text-subtitleText">
                        {{ booleanValue.value }}
                    </span>
                </template>
            </v-switch>
        </template>
        <!-- Update Value Button -->
        <template #append>
            <v-btn
                v-if="!IsOperationVariable && isEditable"
                size="small"
                variant="elevated"
                color="primary"
                class="text-buttonText"
                style="right: -4px"
                @click.stop="updateValue()">
                <v-icon>mdi-upload</v-icon>
            </v-btn>
        </template>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { patchRequest } = useRequestHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    const props = defineProps({
        booleanValue: {
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
        (event: 'updateValue', updatedBooleanValue: any): void;
    }>();

    // Data
    const newBooleanValue = ref<boolean>(false);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const IsOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });
    const IsOutputVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.variableType == 'outputVariables' : false;
    });

    // Watchers
    watch(
        () => selectedNode.value,
        () => {
            initialize(props.booleanValue.value);
        }
    );

    watch(
        () => props.booleanValue,
        (propsBooleanValue) => {
            initialize(propsBooleanValue.value);
        },
        { deep: true }
    );

    onMounted(() => {
        initialize(props.booleanValue.value);
    });

    function initialize(booleanValue: string | boolean): void {
        if (typeof booleanValue === 'string') {
            newBooleanValue.value = booleanValue === 'true';
        } else {
            newBooleanValue.value = booleanValue;
        }
    }

    function updateValue(): void {
        if (IsOperationVariable.value) {
            emit('updateValue', newBooleanValue.value);
            return;
        }

        const path = `${props.booleanValue.path}/$value`;
        const content = JSON.stringify(newBooleanValue.value.toString());
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const context = `updating ${props.booleanValue.modelType} "${props.booleanValue.idShort}"`;
        const disableMessage = false;
        patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                // After successful patch request fetch and dispatch updated SME
                fetchAndDispatchSme(selectedNode.value.path, false);
            }
        });
    }

    function changeState(): void {
        if (IsOperationVariable.value) {
            updateValue();
        }
    }
</script>
