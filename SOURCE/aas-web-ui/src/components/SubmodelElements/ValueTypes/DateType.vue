<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <v-text-field
                v-model="newDateValue"
                type="text"
                variant="outlined"
                density="compact"
                :clearable="isEditable"
                :readonly="!isEditable"
                :color="dateValue.value == newDateValue ? '' : 'warning'"
                :persistent-hint="!isOperationVariable"
                :hint="dateValue.value == newDateValue ? '' : 'Current value not yet saved.'"
                :hide-details="isOperationVariable ? true : false"
                @keydown.enter="updateValue()"
                @click:clear="clearDate"
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
            </v-text-field>
        </v-list-item-title>
        <v-row v-if="!isOutputVariable" class="mt-0">
            <!-- Date Picker -->
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

    // Stores
    const aasStore = useAASStore();

    // Composables
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

    // Data
    const newDateValue = ref<string>('');
    const newDate = ref<any>(new Date());

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

    // Methods
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
                // After successful patch request fetch and dispatch updated SME
                fetchAndDispatchSme(selectedNode.value.path, false);
            }
        });
    }

    // Function to apply the selected date to the newDateTimeStampValue
    function applyDate(date: any): void {
        if (!date) return;

        // convert date to string (format: YYYY-MM-DD)
        const year = date.getFullYear();
        const month = (1 + date.getMonth()).toString().padStart(2, '0'); // Months are zero indexed, hence the +1. padStart will add a 0 in front if it's a single digit
        const day = date.getDate().toString().padStart(2, '0'); // padStart will add a 0 in front if it's a single digit
        const dateString = year + '-' + month + '-' + day;

        newDateValue.value = dateString;

        if (isOperationVariable.value) {
            updateValue();
        }
    }

    // Function to clear the Date
    function clearDate(): void {
        newDateValue.value = '';
    }

    // Function to set the focus on the input field
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
