<template>
    <v-list-item class="pt-0">
        <template v-slot:title>
            <v-switch
                inset
                density="compact"
                v-model="newBooleanValue"
                :readonly="IsOutputVariable"
                color="primary"
                :messages="
                    isOperationVariable ? '' : 'greyed out value on the right shows the current value in the AAS'
                "
                :hide-details="IsOperationVariable ? true : false"
                @update:model-value="changeState">
                <template v-slot:label>
                    <span style="display: inline; white-space: nowrap">{{ booleanValue.value }}</span>
                </template>
            </v-switch>
        </template>
        <template v-slot:append>
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
    </v-list-item>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'BooleanType',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS
        },
        mixins: [RequestHandling],
        props: ['booleanValue', 'isOperationVariable', 'variableType'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                newBooleanValue: false as boolean, // new value of the property
            };
        },

        mounted() {
            // check if this.booleanValue.value is of type string
            if (typeof this.booleanValue.value === 'string') {
                // convert string to boolean
                this.booleanValue.value = this.booleanValue.value === 'true';
            } else {
                this.newBooleanValue = this.booleanValue.value;
            }
        },

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.newBooleanValue = false;
                },
            },

            // Watch for changes in the booleanValue and update the newBooleanValue if the input field is not focused
            booleanValue: {
                deep: true,
                handler() {
                    // check if this.booleanValue.value is of type string
                    if (typeof this.booleanValue.value === 'string') {
                        // convert string to boolean
                        this.booleanValue.value = this.booleanValue.value === 'true';
                    } else {
                        this.newBooleanValue = this.booleanValue.value;
                    }
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
                    this.$emit('updateValue', this.newBooleanValue);
                    return;
                }
                // console.log("Update Value: ", this.newBooleanValue);
                let path = this.booleanValue.path + '/$value';
                let content = JSON.stringify(this.newBooleanValue.toString());
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating ' + this.booleanValue.modelType + ' "' + this.booleanValue.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // this.newPropertyValue = ''; // reset input
                        let updatedBooleanValue = { ...this.booleanValue }; // copy the booleanValue
                        updatedBooleanValue.value = content.toString().replace(/'/g, ''); // update the value of the booleanValue
                        this.$emit('updateValue', updatedBooleanValue); // emit event to update the value in the parent component
                    }
                });
            },

            changeState() {
                if (this.IsOperationVariable) {
                    this.updateValue();
                }
            },
        },
    });
</script>
