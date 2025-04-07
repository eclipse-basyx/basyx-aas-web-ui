<template>
    <v-dialog v-model="editPropertyDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ isNewProperty ? 'Create a new Property' : 'Edit Property' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput
                                v-model="propertyIdShort"
                                label="IdShort"
                                :error="hasError('idShort')"
                                :rules="[rules.required]"
                                :error-messages="getError('idShort')" />
                            <MultiLanguageTextInput v-model="displayName" label="Display Name" type="displayName" />
                            <MultiLanguageTextInput v-model="description" label="Description" type="description" />
                            <SelectInput
                                v-model="propertyCategory"
                                label="Category"
                                type="category"
                                :clearable="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- TODO: Value ID -->
                    <!-- Property Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <SelectInput v-model="valueType" label="Data Type" type="dataType" :clearable="true" />
                            <TextInput v-model="propertyValue" label="Value" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- TODO: What are Extensions?  -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Extensions</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(4)">
                        <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" @click="saveProperty">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
    import { base64Decode, base64Encode } from '@/utils/EncodeDecodeUtils';

    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    const router = useRouter();

    const editPropertyDialog = ref(false);
    const openPanels = ref<number[]>([0]);
    const isNewProperty = ref<boolean>(false);

    const propertyIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const propertyCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const propertyValue = ref<string | null>(null);
    const valueType = ref<aasTypes.DataTypeDefXsd>(aasTypes.DataTypeDefXsd.String);

    const errors = ref<Map<string, string>>(new Map());

    const client = useSMRepositoryClient();

    const rules = {
        required: (value: any) => !!value || 'Required.',
    };

    const props = defineProps<{
        modelValue: boolean;
        newProperty: boolean;
        parentElement: any;
        path?: string;
        property?: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editPropertyDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editPropertyDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );
    watch(
        () => props.newProperty,
        (value) => {
            console.warn(value);
            isNewProperty.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store

    const bordersToShow = computed(() => (panel: number) => {
        let border = '';
        switch (panel) {
            case 0:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border = 'border-b-thin';
                }
                break;
            case 1:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-b-thin';
                }
                break;
            case 2:
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += ' border-b-thin';
                }
                break;
            case 3:
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += 'border-t-thin';
                }
                if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
                    border += ' border-b-thin';
                }
                break;
            case 4:
                if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
                    border = 'border-t-thin';
                }
                break;
        }
        return border;
    });

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    async function saveProperty(): Promise<void> {
        const property: aasTypes.Property = new aasTypes.Property(valueType.value);
        if (propertyIdShort.value !== null) {
            property.idShort = propertyIdShort.value;
        } else {
            errors.value.set('idShort', 'Property IdShort is required');
            return;
        }
        if (propertyValue.value !== null) {
            property.value = propertyValue.value;
        }
        if (semanticId.value !== null) {
            property.semanticId = semanticId.value;
        }
        if (displayName.value !== null) {
            property.displayName = displayName.value;
        }
        if (description.value !== null) {
            property.description = description.value;
        }
        if (propertyCategory.value !== null) {
            property.category = propertyCategory.value;
        }
        if (isNewProperty.value) {
            if (props.parentElement.modelType === 'Submodel') {
                await client.postSubmodelElement(property, props.parentElement.id);
            } else {
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];
                await client.postSubmodelElement(property, submodelId, idShortPath);
                const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    router.push({
                        query: { aas: aasEndpoint, path: props.parentElement.path + '.' + property.idShort },
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Property Path is missing');
                return;
            }
            await client.putSubmodelElement(property, props.path);
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editPropertyDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!isNewProperty.value && props.property) {
            const propertyJSON = await client.fetchSme(
                navigationStore.getSubmodelRepoURL +
                    '/' +
                    base64Encode(props.parentElement.id) +
                    '/submodel-elements/' +
                    props.property.idShort
            );
            const instanceOrError = jsonization.propertyFromJsonable(propertyJSON);
            const property = instanceOrError.mustValue();
            propertyIdShort.value = property.idShort;
            if (property.displayName) {
                displayName.value = property.displayName;
            }
            if (property.description) {
                description.value = property.description;
            }
            if (property.category) {
                propertyCategory.value = property.category;
            }
            if (property.value) {
                propertyValue.value = property.value;
            }
            if (property.valueType) {
                valueType.value = property.valueType;
            }
            if (property.semanticId) {
                semanticId.value = property.semanticId;
            }
            openPanels.value = [0];
        } else {
            propertyIdShort.value = null;
            displayName.value = null;
            description.value = null;
            propertyCategory.value = null;
            propertyValue.value = null;
            valueType.value = aasTypes.DataTypeDefXsd.String;
            semanticId.value = null;
            openPanels.value = [0];
        }
    }
</script>
