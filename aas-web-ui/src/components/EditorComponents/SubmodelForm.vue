<template>
    <v-dialog v-model="editSMDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                {{ newSm ? 'Create a new Submodel' : 'Edit Submodel' }}
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput
                                        v-model="submodelId"
                                        label="ID"
                                        :show-generate-iri-button="true"
                                        type="Submodel"
                                        :disabled="!newSm" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="identifier" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput v-model="submodelIdShort" label="IdShort" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="idShort" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput v-model="submodelKind" label="Modelling Kind" type="modellingKind" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="modellingKind" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="displayName"
                                        :show-label="true"
                                        label="Display Name"
                                        type="displayName" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="displayName" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="description"
                                        :show-label="true"
                                        label="Description"
                                        type="description" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="description" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="submodelCategory"
                                        label="Category"
                                        type="category"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="category" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Administrative Information -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Administrative Information</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput v-model="version" label="Version" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="version" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput v-model="revision" label="Revision" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="revision" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput v-model="creator" label="Creator" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="creator" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput v-model="templateId" label="Template ID" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="templateId" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="semanticId" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Data Specification -->
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(3)">
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
                <v-btn color="primary" @click="saveSubmodel">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useAASStore } from '@/store/AASDataStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newSm: boolean;
        submodel?: aasTypes.Submodel;
    }>();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { generateUUID } = useIDUtils();

    // Stores
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const { postSubmodel, putSubmodel } = useSMRepositoryClient();
    const { putSubmodelDescriptor, createDescriptorFromSubmodel } = useSMRegistryClient();
    const { fetchSmById, fetchSmDescriptor, fetchAndDispatchSm } = useSMHandling();
    const { putAas } = useAASRepositoryClient();

    const editSMDialog = ref(false);
    const submodelObject = ref<aasTypes.Submodel | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const submodelId = ref<string | null>(generateUUID());
    const submodelIdShort = ref<string | null>(null);
    const submodelKind = ref<aasTypes.ModellingKind | null>(aasTypes.ModellingKind.Instance);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const submodelCategory = ref<string | null>(null);

    const version = ref<string | null>(null);
    const revision = ref<string | null>(null);
    const creator = ref<aasTypes.Reference | null>(null);
    const templateId = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode); // Get the selected AAS from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const submodelRepoUrl = computed(() => infrastructureStore.getSubmodelRepoURL);
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
                    border = 'border-t-thin';
                }
                break;
        }
        return border;
    });

    watch(
        () => props.modelValue,
        (value) => {
            editSMDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editSMDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function initializeInputs(): Promise<void> {
        if (props.newSm === false && props.submodel) {
            const submodel = await fetchSmById(props.submodel.id);

            // Parse JSON to AssetAdministrationShell
            const instanceOrError = jsonization.submodelFromJsonable(submodel);
            if (instanceOrError.error !== null) {
                console.error('Error parsing Submodel: ', instanceOrError.error);
                return;
            }
            submodelObject.value = instanceOrError.mustValue();
            // console.log('AASObject: ', AASObject.value);
            // Set values of AAS
            submodelId.value = submodelObject.value.id;
            submodelIdShort.value = submodelObject.value.idShort;
            submodelKind.value = submodelObject.value.kind;
            displayName.value = submodelObject.value.displayName;
            description.value = submodelObject.value.description;
            submodelCategory.value = submodelObject.value.category;
            if (submodelObject.value.administration !== null && submodelObject.value.administration !== undefined) {
                version.value = submodelObject.value.administration.version;
                revision.value = submodelObject.value.administration.revision;
                creator.value = submodelObject.value.administration.creator;
                templateId.value = submodelObject.value.administration.templateId;
            }
            semanticId.value = submodelObject.value.semanticId;
        }
    }

    function createAdministrativeInformation(): aasTypes.AdministrativeInformation {
        const administrativeInformation = new aasTypes.AdministrativeInformation();

        // Add optional parameter version
        if (version.value !== null && version.value !== undefined) {
            administrativeInformation.version = version.value;
        }

        // Add optional parameter revision
        if (revision.value !== null && revision.value !== undefined) {
            administrativeInformation.revision = revision.value;
        }

        // Add optional parameter creator
        if (creator.value !== null && creator.value !== undefined) {
            administrativeInformation.creator = creator.value;
        }

        // Add optional parameter templateId
        if (templateId.value !== null && templateId.value !== undefined) {
            administrativeInformation.templateId = templateId.value;
        }

        return administrativeInformation;
    }

    async function saveSubmodel(): Promise<void> {
        if (submodelId.value === null) return;

        const administrativeInformation = createAdministrativeInformation();

        // TODO: Add embeddedDataSpecifications

        if (props.newSm || submodelObject.value === undefined) {
            submodelObject.value = new aasTypes.Submodel(submodelId.value);
        }

        // Add optional parameter category
        submodelObject.value.category = submodelCategory.value;

        // Add optional parameter idShort
        if (submodelIdShort.value !== null) {
            submodelObject.value.idShort = submodelIdShort.value;
        }

        // Add optional parameter kind
        if (submodelKind.value !== null) {
            submodelObject.value.kind = submodelKind.value;
        }

        // Add optional parameter displayName
        if (displayName.value !== null) {
            submodelObject.value.displayName = displayName.value;
        }

        // Add optional parameter description
        if (description.value !== null) {
            submodelObject.value.description = description.value;
        }

        // Add optional parameter administration
        if (Object.values(administrativeInformation).some((value) => value !== null)) {
            submodelObject.value.administration = administrativeInformation;
        }

        // Add optional parameter semanticId
        if (semanticId.value !== null) {
            submodelObject.value.semanticId = semanticId.value;
        }

        // extensions are out of scope
        // SupplementalSemanticIds are out of scope
        // SubmodelElements are added when they are created

        if (props.newSm) {
            // Create new Submodel
            await postSubmodel(submodelObject.value);
            // Add Submodel Reference to AAS
            await addSubmodelReferenceToAas(submodelObject.value);
            // Fetch and dispatch Submodel
            const query = structuredClone(route.query);
            query.path = submodelRepoUrl.value + '/submodels/' + base64Encode(submodelObject.value.id);
            router.push({ query: query });
            navigationStore.dispatchTriggerTreeviewReload();
        } else {
            // Update existing Submodel
            await putSubmodel(submodelObject.value);
            const jsonSubmodel = jsonization.toJsonable(submodelObject.value);
            // Fetch the current desciptor from the registry
            const fetchedDescriptor = await fetchSmDescriptor(submodelObject.value.id);
            const descriptor = createDescriptorFromSubmodel(jsonSubmodel, fetchedDescriptor.endpoints);
            // Update AAS Descriptor
            await putSubmodelDescriptor(descriptor);
            if (submodelObject.value.id === selectedNode.value.id) {
                const path = submodelRepoUrl.value + '/submodels/' + base64Encode(submodelObject.value.id);
                fetchAndDispatchSm(path);
            }
            navigationStore.dispatchTriggerTreeviewReload();
        }
        clearForm();
        editSMDialog.value = false;
    }

    async function addSubmodelReferenceToAas(submodel: aasTypes.Submodel): Promise<void> {
        if (selectedAAS.value === null) return;
        const localAAS = { ...selectedAAS.value };
        const instanceOrError = jsonization.assetAdministrationShellFromJsonable(localAAS);
        if (instanceOrError.error !== null) {
            console.error('Error parsing AAS: ', instanceOrError.error);
            return;
        }
        const aas = instanceOrError.mustValue();
        // Create new SubmodelReference
        const submodelReference = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
        ]);
        // Check if Submodels are null
        if (aas.submodels === null || aas.submodels === undefined) {
            aas.submodels = [submodelReference];
            localAAS.submodels = [jsonization.toJsonable(submodelReference)];
        } else {
            aas.submodels.push(submodelReference);
            localAAS.submodels.push(jsonization.toJsonable(submodelReference));
        }
        await putAas(aas);

        // Update AAS in Store
        aasStore.dispatchSelectedAAS(localAAS);
    }

    function closeDialog(): void {
        clearForm();
        editSMDialog.value = false;
    }

    function clearForm(): void {
        // Reset all values
        submodelId.value = generateUUID();
        submodelIdShort.value = null;
        displayName.value = null;
        description.value = null;
        submodelCategory.value = null;
        version.value = null;
        revision.value = null;
        creator.value = null;
        templateId.value = null;
        // Reset state of expansion panels
        openPanels.value = [0, 3];
    }
</script>
