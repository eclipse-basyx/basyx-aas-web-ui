<template>
    <v-container fluid class="pa-0">
        <v-card v-if="invalidElementObject" color="elevatedCard" class="mt-4">
            <v-list nav class="pt-0" :class="IsOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- Alert when SubmodelElement is invalid -->
                <v-list-item v-if="!IsOperationVariable">
                    <v-list-item-title class="pt-2">
                        <v-alert
                            text="Invalid SubmodelElement!"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
                <!-- Show Blob of the current SubmodelElement -->
                <v-list-item class="py-0" :class="IsOperationVariable ? 'px-0' : 'px-2'">
                    <v-card
                        v-if="!IsOperationVariable || IsOutputVariable"
                        style="height: 300px; overflow: auto"
                        class="pa-2">
                        <pre>{{ invalidElementObject }}</pre>
                    </v-card>
                    <v-card v-else class="pa-0 ma-0">
                        <v-textarea
                            v-model="jsonString"
                            variant="outlined"
                            hide-details
                            density="compact"
                            :rows="8"></v-textarea>
                        <!-- @update:focused="setFocus($event)"></v-textarea> -->
                    </v-card>
                </v-list-item>
                <v-divider v-if="!IsOperationVariable" class="mt-3"></v-divider>
                <!-- Info listing all available SubmodelElements -->
                <v-list-item v-if="!IsOperationVariable" class="px-3 py-0">
                    <v-list-item-subtitle class="pt-2">{{
                        'The selected SubmodelElement is either non existend or not yet implemented.'
                    }}</v-list-item-subtitle>
                    <template #append>
                        <!-- Tooltip showing all available SubmodelElements -->
                        <v-tooltip open-delay="600" transition="slide-x-transition">
                            <template #activator="{ props }">
                                <v-icon v-bind="props">mdi-information-outline</v-icon>
                            </template>
                            <div>
                                <span class="font-weight-bold">Available SubmodelElements:</span>
                                <ul class="px-3">
                                    <li v-for="(submodelElement, i) in submodelElements" :key="i">
                                        {{ submodelElement }}
                                    </li>
                                </ul>
                            </div>
                        </v-tooltip>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'InvalidElement',
        props: ['invalidElementObject', 'isOperationVariable', 'variableType'],

        setup() {
            return {};
        },

        data() {
            return {
                submodelElements: [
                    'Submodel',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                    'Property',
                    'MultiLanguageProperty',
                    'File',
                    'Blob',
                    'Operation',
                    'ReferenceElement',
                    'Range',
                    'Entity',
                    'RelationshipElement',
                    'AnnotatedRelationshipElement',
                ] as string[],
                jsonString: '',
            };
        },

        computed: {
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

        mounted() {
            // check if isOperationVariable is not undefined
            if (this.isOperationVariable) {
                this.jsonString = JSON.stringify(this.invalidElementObject, null, 2);
            }
        },

        methods: {
            // Function to update the value of the SubmodelElement
            // updateValue() {
            // let invalidElementObject = JSON.parse(this.jsonString);
            // this.$emit('updateValue', invalidElementObject.value);
            // },
            // Function to set the focus on the input field
            // setFocus(e: boolean) {
            // if (!e) {
            // this.updateValue();
            // }
            // },
        },
    });
</script>
