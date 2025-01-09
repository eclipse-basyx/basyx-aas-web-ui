<template>
    <v-dialog v-model="editSMDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newSm ? 'Create a new Submodel' : 'Edit Submodel' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput
                                v-if="newSm"
                                v-model="submodelId"
                                label="ID"
                                :show-generate-iri-button="true"
                                type="Submodel" />
                            <TextInput v-model="submodelIdShort" label="IdShort" />
                            <MultiLanguageTextInput v-model="displayName" label="Display Name" type="displayName" />
                            <MultiLanguageTextInput v-model="description" label="Description" type="description" />
                            <SelectInput
                                v-model="submodelCategory"
                                label="Category"
                                type="category"
                                :clearable="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Administrative Information -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Administrative Information</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput v-model="version" label="Version" />
                            <TextInput v-model="revision" label="Revision" />
                            <ReferenceInput v-model="creator" label="Creator" />
                            <TextInput v-model="templateId" label="Template ID" />
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
    import { useRouter } from 'vue-router';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useSMEHandling } from '@/composables/SMEHandling';
    import { useSMHandling } from '@/composables/SMHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';
    import { URLEncode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newSm: boolean;
        submodel?: any;
    }>();

    // Vue Router
    const router = useRouter();

    // Composables
    const { UUID } = useIDUtils();
    const { fetchAndDispatchSme } = useSMEHandling();
    const { fetchAndDispatchSmById } = useSMHandling();

    // Stores
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const { fetchSmById, postSubmodel, putSubmodel } = useSMRepositoryClient();
    const { putSubmodelDescriptor, createDescriptorFromSubmodel } = useSMRegistryClient();
    const { putAas } = useAASRepositoryClient();

    const editSMDialog = ref(false);
    const submodelObject = ref<aasTypes.Submodel | undefined>(undefined);
    const openPanels = ref<number[]>([0, 3]);

    const submodelId = ref<string | null>(UUID());
    const submodelIdShort = ref<string | null>(null);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const submodelCategory = ref<string | null>(null);

    const version = ref<string | null>(null);
    const revision = ref<string | null>(null);
    const creator = ref<aasTypes.Reference | null>(null);
    const templateId = ref<string | null>(null);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode); // Get the selected AAS from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const submodelRepoUrl = computed(() => navigationStore.getSubmodelRepoURL);
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
            displayName.value = submodelObject.value.displayName;
            description.value = submodelObject.value.description;
            submodelCategory.value = submodelObject.value.category;
            if (submodelObject.value.administration !== null && submodelObject.value.administration !== undefined) {
                version.value = submodelObject.value.administration.version;
                revision.value = submodelObject.value.administration.revision;
                creator.value = submodelObject.value.administration.creator;
                templateId.value = submodelObject.value.administration.templateId;
            }
        }
    }

    async function saveSubmodel(): Promise<void> {
        if (submodelId.value === null) return;

        // Create new Administrative Information object
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

        // Create new Submodel if newSm is true
        if (props.newSm || submodelObject.value === undefined) {
            submodelObject.value = new aasTypes.Submodel(submodelId.value);
        }

        // Add optional parameter category
        if (submodelCategory.value !== null) {
            submodelObject.value.category = submodelCategory.value;
        }

        // Add optional parameter idShort
        if (submodelIdShort.value !== null) {
            submodelObject.value.idShort = submodelIdShort.value;
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

        // embeddedDataSpecifications are out of scope
        // extensions are out of scope
        // SubmodelElements are added when submodels are created

        if (props.newSm) {
            // Create new Submodel
            await postSubmodel(submodelObject.value);
            // Add Submodel Reference to AAS
            await addSubmodelReferenceToAas(submodelObject.value);
            // Fetch and dispatch Submodel
            const path = submodelRepoUrl.value + '/' + URLEncode(submodelObject.value.id).replace(/%3D/g, '');
            const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
            router.push({ query: { aas: aasEndpoint, path: path } });
            await fetchAndDispatchSme(path);
            aasStore.dispatchSelectedNode(submodelObject.value);
            await fetchAndDispatchSmById(submodelObject.value.id);
        } else {
            // Update existing Submodel
            await putSubmodel(submodelObject.value);
            // Update AAS Descriptor
            const jsonSubmodel = jsonization.toJsonable(submodelObject.value);
            const descriptor = createDescriptorFromSubmodel(jsonSubmodel, props.submodel.endpoints);
            await putSubmodelDescriptor(descriptor);
            if (submodelObject.value.id === selectedNode.value.id) {
                const path = submodelRepoUrl.value + '/' + URLEncode(submodelObject.value.id).replace(/%3D/g, '');
                await fetchAndDispatchSme(path);
            }
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
        // dispatch the updated AAS
        // aasStore.dispatchSelectedAAS(localAAS);
    }

    function closeDialog(): void {
        clearForm();
        editSMDialog.value = false;
    }

    function clearForm(): void {
        // Reset all values
        submodelId.value = UUID();
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
