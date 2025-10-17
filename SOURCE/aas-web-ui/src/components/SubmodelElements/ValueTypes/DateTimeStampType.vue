<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
            <v-text-field
                v-model="newDateTimeStampValue"
                type="text"
                variant="outlined"
                density="compact"
                :clearable="isEditable"
                :readonly="!isEditable"
                :color="dateTimeStampValue.value == newDateTimeStampValue ? '' : 'warning'"
                :persistent-hint="!isOperationVariable"
                :hint="dateTimeStampValue.value == newDateTimeStampValue ? '' : 'Current value not yet saved.'"
                :hide-details="isOperationVariable ? true : false"
                @keydown.enter="updateValue()"
                @click:clear="clearDateTimeStamp"
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
            <!-- Time Picker -->
            <v-col cols="auto">
                <v-text-field v-model="newTime" type="time" variant="solo" @change="applyTime"></v-text-field>
            </v-col>
            <!-- TODO Timezone Picker -->
        </v-row>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { createXSDDateString, dateTimeRegex } from '@/utils/DateUtils';
    import { padTo2Digits } from '@/utils/NumberUtils';

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { patchRequest } = useRequestHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    const props = defineProps({
        dateTimeStampValue: {
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
        (event: 'updateValue', updatedDateTimeStampValue: any): void;
    }>();

    // Data
    const newDateTimeStampValue = ref<string>('');
    const newDate = ref<any>(new Date());
    const newTime = ref<string>('');

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
            initialize(props.dateTimeStampValue.value);
        }
    );

    watch(
        () => props.dateTimeStampValue,
        (propsDateTimeStampValue) => {
            if (newDateTimeStampValue.value !== propsDateTimeStampValue.value)
                initialize(props.dateTimeStampValue.value);
        },
        { deep: true }
    );

    onMounted(() => {
        initialize(props.dateTimeStampValue.value);
    });

    function initialize(dateTimeStampValue: string): void {
        if (dateTimeStampValue && dateTimeStampValue.trim() !== '') {
            const dateTimeStampString = dateTimeStampValue.trim();
            const matches = dateTimeStampString.match(new RegExp(dateTimeRegex));
            if (matches) {
                newDateTimeStampValue.value = dateTimeStampString;

                const numbers = matches ? matches.map(Number) : [];
                // const strings = matches ? matches.map(String) : [];

                const year: number = numbers[2];
                const month: number = numbers[3];
                const day: number = numbers[4];
                newDate.value = new Date(year, month - 1, day);

                const hour = numbers[6];
                const minute = numbers[7];
                const second = numbers[8];

                newTime.value = [
                    hour ? padTo2Digits(hour) : padTo2Digits(0),
                    minute ? padTo2Digits(minute) : padTo2Digits(0),
                    second ? padTo2Digits(second) : padTo2Digits(0),
                ].join(':');
                return;
            } else {
                newDateTimeStampValue.value = dateTimeStampValue;
                newDate.value = new Date();
                newTime.value = '00:00:00';
                return;
            }
        }
        newDateTimeStampValue.value = '';
        newDate.value = new Date();
        newTime.value = '00:00:00';
    }

    function updateValue(): void {
        if (isOperationVariable.value) {
            emit('updateValue', newDateTimeStampValue.value);
            return;
        }

        const path = `${props.dateTimeStampValue.path}/$value`;
        const content = JSON.stringify(newDateTimeStampValue.value);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const context = `updating ${props.dateTimeStampValue.modelType} "${props.dateTimeStampValue.idShort}"`;
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
        // replace the date in the newDateTimeStampValue
        const year = date.getFullYear();
        const month = (1 + date.getMonth()).toString().padStart(2, '0'); // Months are zero indexed, hence the +1. padStart will add a 0 in front if it's a single digit
        const day = date.getDate().toString().padStart(2, '0'); // padStart will add a 0 in front if it's a single digit
        const dateString = year + '-' + month + '-' + day;

        let tempTimeStampValue = newDateTimeStampValue.value.split('T')[1];

        // if the time is not set, set it to the current time including the timezone
        if (!tempTimeStampValue) {
            const timeString = createXSDDateString().split('T')[1];
            tempTimeStampValue = timeString;
            newTime.value = timeString.split('.')[0];
        }

        newDateTimeStampValue.value = dateString + 'T' + tempTimeStampValue;

        if (isOperationVariable.value) {
            updateValue();
        }
    }

    // Function to apply the selected time to the newDateTimeStampValue
    function applyTime(): void {
        // replace the time in the newDateTimeStampValue
        const tempDateValue = newDateTimeStampValue.value.split('T')[0];
        const tempStampEnd = newDateTimeStampValue.value.split('.')[1];
        if (!tempStampEnd) {
            newDateTimeStampValue.value = tempDateValue + 'T' + newTime.value + ':00';
            if (newDateTimeStampValue.value.includes('Z')) newDateTimeStampValue.value += 'Z';
        } else {
            newDateTimeStampValue.value = tempDateValue + 'T' + newTime.value + ':00' + '.' + tempStampEnd;
        }
        if (isOperationVariable.value) {
            updateValue();
        }
    }

    // Function to clear the DateTimeStamp
    function clearDateTimeStamp(): void {
        newDateTimeStampValue.value = '';
        newTime.value = '';
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
