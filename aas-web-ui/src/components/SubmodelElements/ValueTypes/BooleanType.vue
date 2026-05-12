<template>
    <v-list-item class="pt-0" :class="isOperationVariable ? '' : 'pb-2'">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <!-- Operation variable: bordered container with badge, name AND switch inside -->
            <div
                v-if="isOperationVariable"
                class="d-flex align-center gap-8 px-3 py-2"
                style="border: 1px solid #cccccc; border-radius: 4px;">
                <v-chip label size="small" color="#fb8c00" text-color="#ffffff" variant="flat" class="font-weight-bold flex-shrink-0">
                    {{ booleanValue.valueType }}
                </v-chip>
                <span class="text-body-2 font-weight-bold flex-shrink-0" style="color: #999;">
                    {{ displayName || booleanValue.idShort }}
                </span>
                <v-spacer></v-spacer>
                <!-- Switch + true/false indicator inside the box -->
                <div class="d-flex align-center gap-1">
                    <v-switch
                        v-model="newBooleanValue"
                        inset
                        density="compact"
                        :readonly="IsOutputVariable || !isEditable"
                        color="primary"
                        :hide-details="true"
                        @update:model-value="changeState">
                    </v-switch>
                    <span
                        :class="newBooleanValue ? 'text-success' : 'text-warning'"
                        style="font-weight: 500; min-width: 36px;">
                        {{ newBooleanValue ? 'true' : 'false' }}
                    </span>
                </div>
            </div>
            <!-- Non-operation variable: label + switch -->
            <template v-else>
                <span class="text-caption font-weight-bold">{{ displayLabel }}:</span>
                <div class="d-flex align-center gap-1">
                    <v-switch
                        v-model="newBooleanValue"
                        inset
                        density="compact"
                        :readonly="IsOutputVariable || !isEditable"
                        color="primary"
                        :hide-details="true"
                        @update:model-value="changeState">
                    </v-switch>
                    <span :class="newBooleanValue ? 'text-success' : 'text-warning'" style="font-weight: 500;">
                        {{ newBooleanValue ? 'true' : 'false' }}
                    </span>
                </div>
            </template>
        </v-list-item-title>
        <!-- Update Value Button (only for non-operation variables) -->
        <template #append>
            <v-btn
                v-if="!isOperationVariable && isEditable"
                size="small"
                variant="elevated"
                color="primary"
                class="text-buttonText"
                style="right: -4px"
                @click.stop="updateValue()">
                <v-icon>mdi-upload</v-icon>
                <v-tooltip activator="parent" location="top">Save changes to the AAS backend</v-tooltip>
            </v-btn>
        </template>
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

    const newBooleanValue = ref<boolean>(false);

    const selectedNode = computed(() => aasStore.getSelectedNode);
    const IsOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });
    const IsOutputVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.variableType == 'outputVariables' : false;
    });
    const displayName = computed(() => {
        if (props.booleanValue.displayName && props.booleanValue.displayName.length > 0) {
            return props.booleanValue.displayName[0]?.text || props.booleanValue.idShort;
        }
        return null;
    });
    const displayLabel = computed(() => {
        return displayName.value || props.booleanValue.idShort || 'Value';
    });

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
