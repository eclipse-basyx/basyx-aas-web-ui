<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="IsOperationVariable ? 'pt-2' : ''">
            <v-text-field
                v-model="newNumberValue"
                type="number"
                variant="outlined"
                density="compact"
                clearable
                :disabled="!isEditable"
                :readonly="IsOutputVariable || !isEditable"
                :hint="isOperationVariable ? '' : 'greyed out value on the left shows the current value in the AAS'"
                :label="isOperationVariable ? numberValue.idShort : ''"
                :hide-details="IsOperationVariable ? true : false"
                @keydown.enter="updateValue()"
                @update:focused="setFocus">
                <!-- Current Value -->
                <template #prepend-inner>
                    <v-chip
                        v-if="(isFocused || numberValue.value != newNumberValue) && !IsOperationVariable"
                        label
                        size="x-small"
                        border
                        >{{ numberValue.value }}</v-chip
                    >
                    <v-divider
                        v-if="(isFocused || numberValue.value != newNumberValue) && !IsOperationVariable"
                        class="ml-3 mr-1"
                        vertical
                        inset
                        style="margin-top: 8px"></v-divider>
                    <v-chip v-if="IsOperationVariable" label size="x-small" border color="primary">{{
                        numberValue.valueType
                    }}</v-chip>
                </template>
                <!-- Update Value Button -->
                <template #append-inner>
                    <span class="text-subtitleText">{{ unitSuffix(numberValue) }}</span>
                    <v-btn
                        v-if="isFocused && !IsOperationVariable"
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

<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'NumberType',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: {
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
        },

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                newNumberValue: '', // new value of the property
                isFocused: false, // boolean to check if the input field is focused
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
                    this.newNumberValue = '';
                },
            },

            // Watch for changes in the numberValue and update the newNumberValue if the input field is not focused
            numberValue: {
                deep: true,
                handler() {
                    if (!this.isFocused) {
                        this.newNumberValue = this.numberValue.value;
                    }
                },
            },
        },

        mounted() {
            this.newNumberValue = this.numberValue.value;
        },

        methods: {
            // Function to update the value of the property
            updateValue() {
                if (this.IsOperationVariable) {
                    this.$emit('updateValue', this.newNumberValue);
                    return;
                }
                // console.log("Update Value: " + this.newNumberValue, ' Path: ' + this.numberValue.path + '/$value');
                let path = this.numberValue.path + '/$value';
                let content = JSON.stringify(this.newNumberValue);
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating ' + this.numberValue.modelType + ' "' + this.numberValue.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // this.newPropertyValue = ''; // reset input
                        let updatedNumberValue = { ...this.numberValue }; // copy the numberValue
                        updatedNumberValue.value = content.toString().replace(/'/g, ''); // update the value of the numberValue
                        this.$emit('updateValue', updatedNumberValue); // emit event to update the value in the parent component
                    }
                });
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                if (this.IsOperationVariable && !e) {
                    this.updateValue();
                }
                this.isFocused = e;
                if (!e) this.newNumberValue = this.numberValue.value; // set input to current value in the AAS if the input field is not focused
            },
        },
    });
</script>
