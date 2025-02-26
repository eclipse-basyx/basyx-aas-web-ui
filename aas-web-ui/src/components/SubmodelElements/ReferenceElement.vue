<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="!IsOperationVariable" class="px-1 pb-1 pt-0">
            <!-- Title of the ReferenceElement Value -->
            <v-list-item-title class="text-subtitle-2 mt-2">{{
                (reference?.type ? reference.type : 'Reference') + ':'
            }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="reference" color="elevatedCard">
            <!-- Value of the ReferenceElement -->
            <v-list nav class="pt-0" :class="IsOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- Reference Representation -->
                <template v-if="reference">
                    <template v-for="(key, i) in reference?.keys" :key="i">
                        <v-list-item>
                            <!-- Tooltip with Reference ID -->
                            <v-tooltip
                                v-if="!IsOperationVariable || IsOutputVariable"
                                activator="parent"
                                open-delay="600"
                                transition="slide-x-transition">
                                <div class="text-caption">
                                    <span class="font-weight-bold">{{ '(' + key.type + ') ' }}</span
                                    >{{ key.value }}
                                </div>
                            </v-tooltip>
                            <!-- Reference Title -->
                            <!-- <template v-if="IsOperationVariable" #title>
                                <div class="text-subtitle-2 mt-2">
                                    {{ IsOperationVariable ? 'Reference:' : 'Description:' }}
                                </div>
                            </template> -->
                            <!-- Reference Representation -->
                            <template #subtitle>
                                <div v-if="!IsOperationVariable || IsOutputVariable" class="pt-2">
                                    <v-chip label size="x-small" border class="mr-2">{{ key?.type }}</v-chip>
                                    <span> {{ key.value }}</span>
                                </div>
                                <!-- Input Field containing the Variable Value -->
                                <v-text-field
                                    v-else
                                    v-model="key.value"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    :clearable="isEditable"
                                    :readonly="!isEditable"
                                    append-icon="mdi-delete"
                                    @click:append="removeReferenceKey(i)"
                                    @update:focused="setFocus($event)"
                                    @keydown.enter="updateReferenceElementObject()">
                                    <template #prepend-inner>
                                        <!-- Reference Entry -->
                                        <v-chip label size="x-small" border>
                                            <span>{{ key.type ? key.type : 'no-selection' }}</span>
                                            <v-icon site="x-small" style="margin-right: -3px">mdi-chevron-down</v-icon>
                                            <!-- Menu to select the Type of Element -->
                                            <v-menu v-if="isEditable" activator="parent">
                                                <v-list density="compact" class="pa-0">
                                                    <v-list-item
                                                        v-for="keyType in keyTypes"
                                                        :key="keyType.id"
                                                        @click="selectKeyType(keyType, key)">
                                                        <v-list-item-title class="py-0">{{
                                                            keyType.text
                                                        }}</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </v-chip>
                                    </template>
                                    <!-- Update Value Button -->
                                    <template #append-inner>
                                        <v-btn
                                            v-if="key.isFocused && isEditable"
                                            size="small"
                                            variant="elevated"
                                            color="primary"
                                            class="text-buttonText"
                                            style="right: -4px"
                                            @click.stop="updateReferenceElementObject()">
                                            <v-icon>mdi-upload</v-icon>
                                        </v-btn>
                                    </template>
                                </v-text-field>
                            </template>
                        </v-list-item>
                        <v-divider v-if="i < reference?.keys.length - 1" class="mt-3"></v-divider>
                    </template>
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
                            @click="jumpToReference(reference)"
                            >Jump</v-btn
                        >
                        <!-- Add new Reference Key -->
                        <v-btn
                            v-if="isEditable && IsOperationVariable && !IsOutputVariable"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            :loading="loading"
                            :disabled="disabled"
                            @click="addReferenceKey()">
                            <div>Add Entry</div>
                            <v-icon class="ml-2">mdi-plus</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'ReferenceElement',
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
            const { checkReference } = useReferenceComposable();
            const { jumpToReference } = useJumpHandling();

            return {
                aasStore, // AASStore Object
                router, // Router Object
                checkReference,
                jumpToReference,
            };
        },

        data() {
            return {
                reference: {} as any,
                loading: false, // Loading State of the Jump-Button (loading when checking if referenced element exists in one of the registered AAS)
                disabled: true, // Disabled State of the Jump-Button (disabled when referenced element does not exist in one of the registered AAS)
                aasDescriptor: Object as any, // AAS Descriptor in which the referenced Element is included (if it exists)
                smRef: Object as any, // SubmodelRef in which the referenced Element is included (if it exists)
                keyTypes: [
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
            // Watch for changes in the referenceElementObject
            referenceElementObject: {
                deep: true,
                handler() {
                    this.reference = this.referenceElementObject?.value;
                    this.validateReference();
                },
            },
        },

        mounted() {
            this.reference = this.referenceElementObject?.value;
            this.validateReference();
        },

        methods: {
            // Function to check if the referenced Element exists
            validateReference() {
                this.loading = true;
                this.checkReference(this.reference)
                    .then((success) => {
                        this.disabled = !success;
                        this.loading = false;
                    })
                    .catch((error) => {
                        // Handle any errors
                        console.error('Error:', error);
                        this.loading = false;
                    });
            },

            updateReferenceElementObject() {
                let referenceElementObject = { ...this.referenceElementObject };
                referenceElementObject.value = this.reference;
                this.$emit('updateValue', referenceElementObject.value);
            },

            // Function to add a new Key to Reference
            addReferenceKey() {
                // console.log('addReferenceKey');
                this.reference.keys.push({ type: '', value: '' });
                this.updateReferenceElementObject();
            },

            // Function to remove a Key from Reference
            removeReferenceKey(index: number) {
                // console.log('removeReferenceKey', index);
                this.reference.keys.splice(index, 1);
                this.updateReferenceElementObject();
            },

            // Function to select the keyType of the Key
            selectKeyType(keyType: any, key: any) {
                // console.log('selectKeyType: ', keyType, key);
                key.type = keyType.text;
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                if (!e) {
                    this.updateReferenceElementObject();
                }
            },
        },
    });
</script>
