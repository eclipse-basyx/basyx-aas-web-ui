<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="!isOperationVariable" class="px-1 pb-1 pt-0">
            <!-- Title of the ReferenceElement Value -->
            <v-list-item-title class="text-subtitle-2 mt-2">{{
                (reference?.type ? reference.type : 'Reference') + ':'
            }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="reference" color="elevatedCard">
            <!-- Value of the ReferenceElement -->
            <v-list nav class="pt-0" :class="isOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- Reference Representation -->
                <template v-if="reference">
                    <template v-for="(key, i) in reference?.keys" :key="i">
                        <v-list-item>
                            <!-- Tooltip with Reference ID -->
                            <v-tooltip
                                v-if="!isOperationVariable || isOutputVariable"
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
                                <div v-if="!isOperationVariable || isOutputVariable" class="pt-2">
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
                                    @click:append="removeReferenceKey(i as number)"
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
                        <v-divider v-if="(i as number) < reference?.keys.length - 1" class="mt-3"></v-divider>
                    </template>
                </template>
            </v-list>
            <v-divider></v-divider>
            <!-- Action Buttons -->
            <v-list nav class="pa-0" :class="isOperationVariable ? '' : 'bg-elevatedCard'">
                <v-list-item>
                    <template #append>
                        <!-- Jump-Button -->
                        <v-btn
                            v-if="!isOperationVariable || isOutputVariable"
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
                            v-if="isEditable && isOperationVariable && !isOutputVariable"
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

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
    import { useJumpHandling } from '@/composables/JumpHandling';

    const props = defineProps({
        referenceElementObject: {
            type: Object as any,
            default: {} as any,
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
        (e: 'updateValue', submodelElement: any): void;
    }>();

    const { checkReference } = useReferenceComposable();
    const { jumpToReference } = useJumpHandling();

    const reference = ref<any>({});
    const loading = ref<boolean>(false); // Loading State of the Jump-Button (loading when checking if referenced element exists in one of the registered AAS)
    const disabled = ref<boolean>(true); // Disabled State of the Jump-Button (disabled when referenced element does not exist in one of the registered AAS)
    const keyTypes = ref<Array<any>>([
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
        { id: 12, text: 'Operation' },
        { id: 13, text: 'Capability' },
        { id: 14, text: 'EventElement' },
        { id: 15, text: 'BasicEventElement' },
        { id: 16, text: 'ReferenceElement' },
        { id: 17, text: 'RelationshipElement' },
        { id: 18, text: 'AnnotatedRelationshipElement' },
        { id: 19, text: 'ConceptDescription' },
        { id: 20, text: 'DataElement' },
        { id: 21, text: 'FragmentReference' },
        { id: 22, text: 'GlobalReference' },
        { id: 23, text: 'Identifiable' },
        { id: 24, text: 'Referable' },
    ]); // Array of Element types

    const isOperationVariable = computed(() => {
        // check if isOperationVariable is not undefined
        if (props.isOperationVariable != undefined) {
            return props.isOperationVariable;
        } else {
            return false;
        }
    });

    const isOutputVariable = computed(() => {
        // check if isOperationVariable is not undefined
        if (props.isOperationVariable != undefined) {
            return props.variableType == 'outputVariables';
        } else {
            return false;
        }
    });

    watch(
        props.referenceElementObject,
        () => {
            reference.value = props.referenceElementObject?.value;
            validateReference();
        },
        { deep: true }
    );

    onMounted(() => {
        reference.value = props.referenceElementObject?.value;
        validateReference();
    });

    function validateReference(): void {
        loading.value = true;

        checkReference(reference.value)
            .then((success) => {
                disabled.value = !success;
                loading.value = false;
            })
            .catch((error) => {
                // Handle any errors
                console.error('Error:', error);
                loading.value = false;
            });
    }

    function updateReferenceElementObject(): void {
        let referenceElementObject = { ...props.referenceElementObject };
        referenceElementObject.value = reference.value;
        // Emit the updated ReferenceElement Object
        emit('updateValue', referenceElementObject.value);
    }

    function addReferenceKey(): void {
        // console.log('addReferenceKey');
        reference.value.keys.push({ type: '', value: '' });
        updateReferenceElementObject();
    }

    function removeReferenceKey(index: number): void {
        // console.log('removeReferenceKey', index);
        reference.value.keys.splice(index, 1);
        updateReferenceElementObject();
    }

    function selectKeyType(keyType: any, key: any): void {
        // console.log('selectKeyType: ', keyType, key);
        key.type = keyType.text;
    }

    function setFocus(e: boolean): void {
        if (!e) {
            updateReferenceElementObject();
        }
    }
</script>
