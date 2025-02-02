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
                :hint="dateTimeStampValue.value == newDateTimeStampValue ? '' : 'Current Value not yet saved.'"
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
            <!-- Timezone Picker -->
        </v-row>
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

    // Data
    const dateTimeStampRegex =
        /^(\d{4})-([1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0[0-9]|1[0-3]):[0-5][0-9])$/;
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
        (selectedNodeValue) => {
            if (selectedNodeValue && Object.keys(selectedNodeValue)) {
                newDateTimeStampValue.value = props.dateTimeStampValue.value;
            } else {
                newDateTimeStampValue.value = '';
            }
        },
        { deep: true }
    );

    watch(
        () => props.dateTimeStampValue,
        () => {
            if (!props.dateTimeStampValue.value || props.dateTimeStampValue.value == '') {
                newDateTimeStampValue.value = '';
            } else {
                newDateTimeStampValue.value = props.dateTimeStampValue.value;
            }
        },
        { deep: true }
    );

    watch(
        () => props.dateTimeStampValue,
        (propsDateTimeStampValue) => {
            initialize(propsDateTimeStampValue.value);
        },
        { deep: true }
    );

    onMounted(() => {
        initialize(props.dateTimeStampValue.value);
    });

    function initialize(dateTimeStampValue: string): void {
        // if (!props.dateTimeStampValue.value || props.dateTimeStampValue.value == '') {
        // newDateTimeStampValue.value = '';
        // } else {
        // newDateTimeStampValue.value = props.dateTimeStampValue.value;
        // }
        // const date = createDateObject(newDateTimeStampValue.value); // create a new Date Object from the given string
        // newTime.value = getTimeFromDate(date); // get the time from the date

        if (dateTimeStampValue && dateTimeStampValue.trim() !== '') {
            const dateTimeStampString = dateTimeStampValue.trim();
            const matches = dateTimeStampString.match(new RegExp(dateTimeStampRegex));
            if (matches) {
                newDateTimeStampValue.value = dateTimeStampString;
                console.log(matches);
                // const numbers = matches ? matches.map(Number) : [];

                // const year: number = numbers[1];
                // const month: number = numbers[2];
                // const day: number = numbers[3];
                // newDate.value = new Date(year, month - 1, day);
                return;
            }
        }
        newDateTimeStampValue.value = '';
        newDate.value = new Date();
        newTime.value = '00:00';
    }

    function updateValue(): void {
        if (isOperationVariable.value) {
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

    // create XSD Date String for the current date
    function createXSDDateString(): string {
        const date = new Date();

        // Generate the date and time part in the format 'yyyy-mm-ddThh:mm:ss.sss'
        let dateTime = date.toISOString();

        // Get the timezone offset in minutes and convert it to the format '+hh:mm'
        let timezoneOffset = -date.getTimezoneOffset();
        const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
        timezoneOffset = Math.abs(timezoneOffset);
        const timezoneHours = String(Math.floor(timezoneOffset / 60)).padStart(2, '0');
        const timezoneMinutes = String(timezoneOffset % 60).padStart(2, '0');
        const timezone = timezoneSign + timezoneHours + ':' + timezoneMinutes;

        // Add pseudo microseconds and replace the timezone part
        const pseudoMicroseconds = '000';
        dateTime = dateTime.replace('Z', pseudoMicroseconds + timezone);

        return dateTime;
    }

    // Function to create a new Date Object from the given string
    function createDateObject(dateString: string): Date {
        const cleanedTimestamp = dateString.split('[')[0];

        return new Date(cleanedTimestamp);
    }

    // Function to get the time from the given Date Object
    function getTimeFromDate(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        // check if any of the values is NaN
        if (isNaN(Number(hours)) || isNaN(Number(minutes)) || isNaN(Number(seconds)) || !hours || !minutes || !seconds)
            return '';

        return hours + ':' + minutes + ':' + seconds;
    }

    // Function to apply the selected date to the newDateTimeStampValue
    function applyDate(date: any): void {
        if (!date) return;

        // convert date to string (format: YYYY-MM-DD)
        const year = date.getFullYear();
        const month = (1 + date.getMonth()).toString().padStart(2, '0'); // Months are zero indexed, hence the +1. padStart will add a 0 in front if it's a single digit
        const day = date.getDate().toString().padStart(2, '0'); // padStart will add a 0 in front if it's a single digit
        const dateString = year + '-' + month + '-' + day;

        // replace the date in the newDateTimeStampValue
        let tempDateTimeStampValue = newDateTimeStampValue.value.split('T')[1];

        // if the time is not set, set it to the current time including the timezone
        if (!tempDateTimeStampValue) {
            const timeString = createXSDDateString().split('T')[1];
            tempDateTimeStampValue = timeString;
            newTime.value = timeString.split('.')[0];
        }

        newDateTimeStampValue.value = dateString + 'T' + tempDateTimeStampValue;

        if (isOperationVariable.value) {
            updateValue();
        }
    }

    // Function to apply the selected time to the newDateTimeStampValue
    function applyTime(): void {
        // replace the time in the newDateTimeStampValue
        const tempDateTimeStampValue = newDateTimeStampValue.value.split('T')[0];
        const tempStampEnd = newDateTimeStampValue.value.split('.')[1];

        if (!tempStampEnd) {
            newDateTimeStampValue.value = tempDateTimeStampValue + 'T' + newTime.value + 'Z';
        } else {
            newDateTimeStampValue.value = tempDateTimeStampValue + 'T' + newTime.value + '.' + tempStampEnd;
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
    function setFocus(e: boolean): void {
        if (isOperationVariable.value && !e) {
            updateValue();
        }
    }
</script>

<style scoped>
    :deep()div.v-messages__message {
        color: #fb8c00;
    }
</style>
