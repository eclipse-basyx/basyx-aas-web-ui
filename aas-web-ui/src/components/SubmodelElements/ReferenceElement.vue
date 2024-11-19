<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="!IsOperationVariable" class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Reference: ' }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="referenceElementObject" color="elevatedCard">
            <!-- Value of the Reference -->
            <v-list nav class="pt-0" :class="IsOperationVariable ? '' : 'bg-elevatedCard'">
                <template v-for="(value, i) in referenceValue" :key="i">
                    <v-list-item>
                        <!-- Tooltip with Reference ID -->
                        <v-tooltip
                            v-if="!IsOperationVariable || IsOutputVariable"
                            activator="parent"
                            open-delay="600"
                            transition="slide-x-transition">
                            <div class="text-caption">
                                <span class="font-weight-bold">{{ '(' + value.type + ') ' }}</span
                                >{{ value.value }}
                            </div>
                        </v-tooltip>
                        <!-- Reference Title -->
                        <template #title>
                            <div class="text-subtitle-2 mt-2">
                                {{ IsOperationVariable ? 'Reference:' : 'Description:' }}
                            </div>
                        </template>
                        <!-- Reference Representation -->
                        <template #subtitle>
                            <div v-if="!IsOperationVariable || IsOutputVariable" class="pt-2">
                                <v-chip label size="x-small" border class="mr-2">{{ value.type }}</v-chip>
                                <span> {{ value.value }}</span>
                            </div>
                            <!-- Input Field containing the Variable Value -->
                            <v-text-field
                                v-else
                                v-model="value.value"
                                variant="outlined"
                                density="compact"
                                hide-details
                                :clearable="isEditable"
                                :readonly="!isEditable"
                                append-icon="mdi-delete"
                                @click:append="removeReferenceEntry(i)"
                                @update:focused="setFocus($event)"
                                @keydown.enter="updateReferenceObject()">
                                <template #prepend-inner>
                                    <!-- Reference Entry -->
                                    <v-chip label size="x-small" border>
                                        <span>{{ value.type ? value.type : 'no-selection' }}</span>
                                        <v-icon site="x-small" style="margin-right: -3px">mdi-chevron-down</v-icon>
                                        <!-- Menu to select the Type of Element -->
                                        <v-menu v-if="isEditable" activator="parent">
                                            <v-list density="compact" class="pa-0">
                                                <v-list-item
                                                    v-for="elementType in elementTypes"
                                                    :key="elementType.id"
                                                    @click="selectElementType(elementType, value)">
                                                    <v-list-item-title class="py-0">{{
                                                        elementType.text
                                                    }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </v-chip>
                                </template>
                                <!-- Update Value Button -->
                                <template #append-inner>
                                    <v-btn
                                        v-if="value.isFocused && isEditable"
                                        size="small"
                                        variant="elevated"
                                        color="primary"
                                        class="text-buttonText"
                                        style="right: -4px"
                                        @click.stop="updateReferenceObject()">
                                        <v-icon>mdi-upload</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </template>
                    </v-list-item>
                    <v-divider v-if="i < referenceValue.length - 1" class="mt-3"></v-divider>
                </template>
            </v-list>
            <v-divider></v-divider>
            <!-- Action Buttons -->
            <v-list nav class="pa-0" :class="IsOperationVariable ? '' : 'bg-elevatedCard'">
                <v-list-item>
                    <template #append>
                        <!-- Jump-Button -->
                        <v-btn
                            v-if="!IsOperationVariable || IsOutputVariable"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            :loading="loading"
                            :disabled="disabled"
                            @click="jumpToReferencedElement(referencedAAS, referenceValue, referencedSubmodel)"
                            >Jump</v-btn
                        >
                        <!-- Add new Reference Entry -->
                        <v-btn
                            v-if="isEditable && IsOperationVariable && !IsOutputVariable"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            :loading="loading"
                            :disabled="disabled"
                            @click="addReferenceEntry()">
                            <div>Add Entry</div>
                            <v-icon class="ml-2">mdi-plus</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'ReferenceElement',
        mixins: [SubmodelElementHandling],
        props: {
            referenceElementObject: {
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
            const router = useRouter();

            return {
                aasStore, // AASStore Object
                router, // Router Object
            };
        },

        data() {
            return {
                referenceValue: [] as Array<any>, // Value of the Reference (Array of Reference Keys)
                loading: false, // Loading State of the Jump-Button (loading when checking if referenced element exists in one of the registered AAS)
                disabled: true, // Disabled State of the Jump-Button (disabled when referenced element does not exist in one of the registered AAS)
                referencedAAS: Object as any, // AAS in which the referenced Element is included (if it exists)
                referencedSubmodel: Object as any, // Submodel in which the referenced Element is included (if it exists)
                elementTypes: [
                    { id: 1, text: 'AssetAdministrationShell' },
                    { id: 2, text: 'Submodel' },
                    { id: 3, text: 'SubmodelElement' },
                    { id: 4, text: 'SubmodelElementCollection' },
                    { id: 5, text: 'SubmodelElementList' },
                    { id: 6, text: 'Property' },
                    { id: 7, text: 'MultilanguageProperty' },
                    { id: 8, text: 'Entity' },
                    { id: 9, text: 'File' },
                    { id: 10, text: 'Blob' },
                    { id: 11, text: 'Range' },
                    { id: 12, text: 'Entity' },
                    { id: 13, text: 'Operation' },
                    { id: 14, text: 'Capability' },
                    { id: 15, text: 'EventElement' },
                    { id: 16, text: 'BasicEventElement' },
                    { id: 17, text: 'ReferenceElement' },
                    { id: 18, text: 'RelationshipElement' },
                    { id: 19, text: 'AnnotatedRelationshipElement' },
                    { id: 20, text: 'ConceptDescription' },
                    { id: 22, text: 'DataElement' },
                    { id: 23, text: 'FragmentReference' },
                    { id: 24, text: 'GlobalReference' },
                    { id: 25, text: 'Identifiable' },
                    { id: 26, text: 'Referable' },
                ] as Array<any>, // Array of Element Types (e.g. 'Property', 'File', 'Blob', ...)
            };
        },

        computed: {
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
                    this.referenceValue = [];
                },
            },

            // Watch for changes in the referenceElementObject
            referenceElementObject: {
                deep: true,
                handler() {
                    this.referenceValue = this.referenceElementObject?.value?.keys;
                    this.validateReference();
                },
            },
        },

        mounted() {
            // console.log('ReferenceElement Mounted:', this.referenceElementObject);
            this.referenceValue = this.referenceElementObject?.value?.keys;
            this.validateReference();
        },

        methods: {
            // Function to check if the referenced Element exists
            validateReference() {
                this.loading = true;
                this.checkReference(this.referenceValue)
                    .then(({ success, aas, submodel }) => {
                        // console.log('checkReference: ', success, aas, submodel);
                        if (success) {
                            this.referencedAAS = aas;
                            this.referencedSubmodel = submodel;
                            this.disabled = false;
                        }
                        this.loading = false;
                    })
                    .catch((error) => {
                        // Handle any errors
                        console.error('Error:', error);
                        this.loading = false;
                    });
            },

            updateReferenceObject() {
                let referenceElementObject = { ...this.referenceElementObject };
                referenceElementObject.value.keys = this.referenceValue;
                this.$emit('updateValue', referenceElementObject.value);
            },

            // Function to add a new Reference Entry
            addReferenceEntry() {
                // console.log('addReferenceEntry');
                this.referenceValue.push({ type: '', value: '' });
                this.updateReferenceObject();
            },

            // Function to remove a Reference Entry
            removeReferenceEntry(index: number) {
                // console.log('removeReferenceEntry');
                this.referenceValue.splice(index, 1);
                this.updateReferenceObject();
            },

            // Function to select the ElementType of the Entry
            selectElementType(elementType: any, value: any) {
                // console.log('selectedElementType: ', elementType);
                value.type = elementType.text;
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                if (!e) {
                    this.updateReferenceObject();
                }
            },
        },
    });
</script>
