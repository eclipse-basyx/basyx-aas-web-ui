<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <!-- Operation variable: bordered container with badge, name AND input inside -->
            <div
                v-if="isOperationVariable"
                class="d-flex align-center gap-8 px-3 py-2"
                style="border: 1px solid #cccccc; border-radius: 4px;">
                <v-chip label size="small" color="#fb8c00" text-color="#ffffff" variant="flat" class="font-weight-bold flex-shrink-0">
                    {{ dateValue.valueType }}
                </v-chip>
                <span class="text-body-2 font-weight-bold flex-shrink-0" style="color: #999;">
                    {{ dateValue.idShort }}
                </span>
                <v-text-field
                    v-model="newDateValue"
                    type="text"
                    variant="outlined"
                    density="compact"
                    class="flex-grow-1"
                    :clearable="isEditable"
                    :readonly="!isEditable"
                    :hide-details="true"
                    @keydown.enter="updateValue()"
                    @click:clear="clearDate"
                    @update:focused="setFocus">
                </v-text-field>
            </div>
            <!-- Non-operation variable: original layout -->
            <v-text-field
                v-else
                v-model="newDateValue"
                type="text"
                variant="outlined"
                density="compact"
                :clearable="isEditable"
                :readonly="!isEditable"
                :color="dateValue.value == newDateValue ? '' : 'warning'"
                :persistent-hint="true"
                :hint="dateValue.value == newDateValue ? '' : 'Current value not yet saved.'"
                :hide-details="false"
                @keydown.enter="updateValue()"
                @click:clear="clearDate"
                @update:focused="setFocus">
                <template #append-inner>
                    <v-btn
                        v-if="isEditable"
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
        <v-row v-if="!isOutputVariable" class="mt-0">
            <v-col cols="auto">
                <v-date-picker
                    v-model="newDate"
                    :disabled="!isEditable"
                    color="primary"
                    elevation="1"
                    show-adjacent-months
                    @update:model-value="applyDate"></v-date-picker>
            </v-col>
        </v-row>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { dateRegex } from '@/utils/DateUtils';

    const aasStore = useAASStore();
    const { patchRequest } = useRequestHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    const props = defineProps({
        dateValue: {
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
        (event: 'updateValue', updatedDateValue: any): void;
    }>();

    const newDateValue = ref<string>('');
    const newDate = ref<any>(new Date());

    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isOperationVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.isOperationVariable : false;
    });
    const isOutputVariable = computed(() => {
        return props.isOperationVariable != undefined ? props.variableType == 'outputVariables' : false;
    });

    watch(
        () => selectedNode.value,
        () => {
            initialize(props.dateValue.value);
        }
    );

    watch(
        () => props.dateValue,
        (propsDateValue) => {
            if (newDateValue.value !== propsDateValue.value) initialize(propsDateValue.value);
        },
        { deep: true }
    );

    onMounted(() => {
        initialize(props.dateValue.value);
    });

    function initialize(dateValue: string): void {
        if (dateValue && dateValue.trim() !== '') {
            const dateString = dateValue.trim();
            const matches = dateString.match(new RegExp(dateRegex));
            if (matches) {
                newDateValue.value = dateString;
                const numbers = matches ? matches.map(Number) : [];
                const year: number = numbers[1];
                const month: number = numbers[2];
                const day: number = numbers[3];
                newDate.value = new Date(year, month - 1, day);
                return;
            }
        }
        newDateValue.value = '';
        newDate.value = new Date();
    }

    function updateValue(): void {
        if (isOperationVariable.value) {
            emit('updateValue', newDateValue.value);
            return;
        }
        const path = `${props.dateValue.path}/$value`;
        const content = JSON.stringify(newDateValue.value);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const context = `updating ${props.dateValue.modelType} "${props.dateValue.idShort}"`;
        const disableMessage = false;
        patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                fetchAndDispatchSme(selectedNode.value.path, false);
            }
        });
    }

    function applyDate(date: any): void {
        if (!date) return;
        const year = date.getFullYear();
        const month = (1 + date.getMonth()).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        newDateValue.value = year + '-' + month + '-' + day;
        if (isOperationVariable.value) updateValue();
    }

    function clearDate(): void {
        newDateValue.value = '';
    }

    function setFocus(isFocusedToSet: boolean): void {
        if (isOperationVariable.value && !isFocusedToSet) {
            updateValue();
        }
    }
</script>

<style scoped>
    :deep()div.v-messages__message {
        color: #fb8c00;
    }
</style>
