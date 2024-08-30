<template>
    <v-list-item class="pt-0">
        <v-list-item-title :class="IsOperationVariable ? 'pt-2' : ''">
            <v-textarea
                variant="outlined"
                density="compact"
                clearable
                v-model="newStringValue"
                :readonly="IsOutputVariable"
                auto-grow
                :rows="1"
                :label="isOperationVariable ? stringValue.idShort : ''"
                @update:focused="setFocus"
                :hide-details="IsOperationVariable ? true : false">
                <!-- Update Value Button -->
                <template v-slot:append-inner>
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
            </v-textarea>
        </v-list-item-title>
    </v-list-item>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'StringType',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS
        },
        mixins: [RequestHandling],
        props: ['stringValue', 'isOperationVariable', 'variableType'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                newStringValue: '', // new value of the property
            };
        },

        mounted() {
            this.newStringValue = this.stringValue.value;
        },

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.newStringValue = '';
                },
            },

            // Watch for changes in the stringValue and update the newStringValue if the input field is not focused
            stringValue: {
                deep: true,
                handler() {
                    this.newStringValue = this.stringValue.value;
                },
            },
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

        methods: {
            // Function to update the value of the property
            updateValue() {
                if (this.IsOperationVariable) {
                    this.$emit('updateValue', this.newStringValue);
                    return;
                }
                // console.log("Update Value: " + this.newPropertyValue);
                let path = this.stringValue.path + '/$value';
                let content = JSON.stringify(this.newStringValue);
                let context = 'updating ' + this.stringValue.modelType + ' "' + this.stringValue.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                const requestHeaders = new Headers();
                requestHeaders.append('Content-Type', 'application/json');
                this.patchRequest(path, content, requestHeaders, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // this.newPropertyValue = ''; // reset input
                        let updatedStringValue = { ...this.stringValue }; // copy the stringValue
                        updatedStringValue.value = content.toString().replace(/'/g, ''); // update the value of the stringValue
                        this.$emit('updateValue', updatedStringValue); // emit event to update the value in the parent component
                    }
                });
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
