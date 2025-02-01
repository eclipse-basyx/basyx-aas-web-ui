<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <v-textarea
                v-model="newStringValue"
                variant="outlined"
                density="compact"
                :clearable="isEditable"
                :readonly="isOutputVariable || !isEditable"
                auto-grow
                :rows="1"
                :label="isOperationVariable ? stringValue.idShort : ''"
                :hide-details="isOperationVariable ? true : false"
                @update:focused="setFocus">
                <!-- Update Value Button -->
                <template #append-inner>
                    <v-btn
                        v-if="!isOperationVariable && isEditable"
                        size="small"
                        variant="elevated"
                        color="primary"
                        class="text-buttonText"
                        style="right: -4px"
                        @click.stop="updateValue()">
                        <v-icon>mdi-upload</v-icon>
                    </v-btn>
                </template>
            </v-textarea>
        </v-list-item-title>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useSMEHandling } from '@/composables/SMEHandling';
    import { useAASStore } from '@/store/AASDataStore';

    // Stores
    const aasStore = useAASStore();

    // Composables
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

    // Data
    const newStringValue = ref('');

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });
    const isOutputVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.variableType == 'outputVariables' : false;
    });

    // Watchers
    watch(
        selectedNode,
        () => {
            newStringValue.value = '';
        },
        { deep: true }
    );
    watch(
        () => props.stringValue,
        () => {
            newStringValue.value = props.stringValue.value;
        },
        { deep: true }
    );

    onMounted(() => {
        newStringValue.value = props.stringValue.value;
    });

    // Methods
    function updateValue(): void {
        if (isOperationVariable.value) {
            return;
        }
        const path = `${props.stringValue.path}/$value`;
        const content = JSON.stringify(newStringValue.value);
        const context = `updating ${props.stringValue.modelType} "${props.stringValue.idShort}"`;
        const disableMessage = false;
        const requestHeaders = new Headers();
        requestHeaders.append('Content-Type', 'application/json');
        patchRequest(path, content, requestHeaders, context, disableMessage).then((response: any) => {
            if (response.success) {
                // After successful patch request fetch and dispatch updated SME
                fetchAndDispatchSme(selectedNode.value.path, false);
            }
        });
    }

    function setFocus(e: boolean): void {
        if (isOperationVariable.value && !e) {
            updateValue();
        }
    }
</script>
