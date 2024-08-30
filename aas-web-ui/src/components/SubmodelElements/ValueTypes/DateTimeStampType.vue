<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="IsOperationVariable ? 'pt-2' : ''">
            <v-text-field
                v-model="newDateTimeStampValue"
                type="text"
                variant="outlined"
                density="compact"
                clearable
                :color="dateTimeStampValue.value == newDateTimeStampValue ? '' : 'warning'"
                :persistent-hint="!IsOperationVariable"
                :hint="dateTimeStampValue.value == newDateTimeStampValue ? '' : 'Current Value not yet saved.'"
                :hide-details="IsOperationVariable ? true : false"
                @keydown.enter="updateValue()"
                @click:clear="clearDateTimeStamp"
                @update:focused="setFocus">
                <!-- Update Value Button -->
                <template #append-inner>
                    <span class="text-subtitleText">{{ unitSuffix(dateTimeStampValue) }}</span>
                    <v-btn
                        v-if="!IsOperationVariable"
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
        <v-row v-if="!IsOutputVariable" class="mt-0">
            <!-- Date Picker -->
            <v-col cols="auto">
                <v-date-picker color="primary" elevation="1" @update:model-value="applyDate"></v-date-picker>
            </v-col>
            <!-- Time Picker -->
            <v-col cols="auto">
                <v-text-field v-model="time" type="time" variant="solo" @change="applyTime"></v-text-field>
            </v-col>
            <!-- Timezone Picker -->
        </v-row>
    </v-list-item>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useDate } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'DateTimeStampType',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['dateTimeStampValue', 'isOperationVariable', 'variableType'],

        setup() {
            const aasStore = useAASStore();
            const date = useDate();

            return {
                aasStore, // AASStore Object
                date,
            };
        },

        data() {
            return {
                newDateTimeStampValue: '', // new value of the property
                time: '', // string to store the time
            };
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            // Check if the Property is an Operation Variable
            IsOperationVariable() {
                // check if isOperationVariable is not undefined
                if (this.isOperationVariable != undefined) {
                    return this.isOperationVariable;
                } else {
                    return false;
                }
            },

            // Check if the Property is an Output Operation Variable
            IsOutputVariable() {
                // check if isOperationVariable is not undefined
                if (this.isOperationVariable != undefined) {
                    return this.variableType == 'outputVariables';
                } else {
                    return false;
                }
            },
        },

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.newDateTimeStampValue = '';
                },
            },

            // Watch for changes in the dateTimeStampValue and update the newDateTimeStampValue if the input field is not focused
            dateTimeStampValue: {
                deep: true,
                handler() {
                    if (!this.dateTimeStampValue.value || this.dateTimeStampValue.value == '') {
                        this.newDateTimeStampValue = '';
                    } else {
                        this.newDateTimeStampValue = this.dateTimeStampValue.value;
                    }
                },
            },
        },

        mounted() {
            if (!this.dateTimeStampValue.value || this.dateTimeStampValue.value == '') {
                this.newDateTimeStampValue = '';
            } else {
                this.newDateTimeStampValue = this.dateTimeStampValue.value;
            }
            let date = this.createDateObject(this.newDateTimeStampValue); // create a new Date Object from the given string
            this.time = this.getTimeFromDate(date); // get the time from the date
        },

        methods: {
            // Function to update the value of the property
            updateValue() {
                if (this.IsOperationVariable) {
                    this.$emit('updateValue', this.newDateTimeStampValue);
                    return;
                }
                // console.log("Update Value: " + this.newPropertyValue);
                let path = this.dateTimeStampValue.path + '/$value';
                let content = JSON.stringify(this.newDateTimeStampValue);
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context =
                    'updating ' + this.dateTimeStampValue.modelType + ' "' + this.dateTimeStampValue.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // this.newPropertyValue = ''; // reset input
                        let updatedDateTimeStampValue = { ...this.dateTimeStampValue }; // copy the stringValue
                        updatedDateTimeStampValue.value = content.toString().replace(/'/g, ''); // update the value of the stringValue
                        this.$emit('updateValue', updatedDateTimeStampValue); // emit event to update the value in the parent component
                    }
                });
            },

            // create XSD Date String for the current date
            createXSDDateString() {
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

                // console.log(dateTime);
                return dateTime;
            },

            // Function to create a new Date Object from the given string
            createDateObject(dateString: string) {
                // console.log('createDateObject: ', dateString)
                let cleanedTimestamp = dateString.split('[')[0];
                return new Date(cleanedTimestamp);
            },

            // Function to get the time from the given Date Object
            getTimeFromDate(date: Date) {
                let hours = date.getHours().toString().padStart(2, '0');
                let minutes = date.getMinutes().toString().padStart(2, '0');
                let seconds = date.getSeconds().toString().padStart(2, '0');
                // check if any of the values is NaN
                if (isNaN(Number(hours)) || isNaN(Number(minutes)) || isNaN(Number(seconds))) return '';
                return hours + ':' + minutes + ':' + seconds;
            },

            // Function to apply the selected date to the newDateTimeStampValue
            applyDate(date: any) {
                // console.log('applyDate: ', date);
                if (!date) return;
                // convert date to string (format: YYYY-MM-DD)
                let year = date.getFullYear();
                let month = (1 + date.getMonth()).toString().padStart(2, '0'); // Months are zero indexed, hence the +1. padStart will add a 0 in front if it's a single digit
                let day = date.getDate().toString().padStart(2, '0'); // padStart will add a 0 in front if it's a single digit
                let dateString = year + '-' + month + '-' + day;
                // console.log('dateString: ', dateString);
                // replace the date in the newDateTimeStampValue
                let tempDateTimeStampValue = this.newDateTimeStampValue.split('T')[1];
                // if the time is not set, set it to the current time including the timezone
                if (!tempDateTimeStampValue) {
                    let time = this.createXSDDateString().split('T')[1];
                    tempDateTimeStampValue = time;
                    this.time = time.split('.')[0];
                }
                this.newDateTimeStampValue = dateString + 'T' + tempDateTimeStampValue;
                if (this.IsOperationVariable) {
                    this.updateValue();
                }
            },

            // Function to apply the selected time to the newDateTimeStampValue
            applyTime() {
                // console.log('applyTime: ', this.time);
                // replace the time in the newDateTimeStampValue
                let tempDateTimeStampValue = this.newDateTimeStampValue.split('T')[0];
                let tempStampEnd = this.newDateTimeStampValue.split('.')[1];
                if (!tempStampEnd) {
                    this.newDateTimeStampValue = tempDateTimeStampValue + 'T' + this.time + 'Z';
                } else {
                    this.newDateTimeStampValue = tempDateTimeStampValue + 'T' + this.time + '.' + tempStampEnd;
                }
                if (this.IsOperationVariable) {
                    this.updateValue();
                }
            },

            // clear the DateTimeStamp
            clearDateTimeStamp() {
                this.newDateTimeStampValue = '';
                this.time = '';
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                if (this.IsOperationVariable && !e) {
                    this.updateValue();
                }
            },
        },
    });
</script>

<style scoped>
    :deep()div.v-messages__message {
        color: #fb8c00;
    }
</style>
