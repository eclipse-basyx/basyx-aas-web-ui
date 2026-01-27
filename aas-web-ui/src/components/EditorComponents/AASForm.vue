<template>
    <v-dialog v-model="editAASDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newShell ? 'Create a new AAS' : 'Edit AAS' }}</span>
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
                                        v-model="AASId"
                                        label="ID"
                                        :show-generate-iri-button="true"
                                        type="AssetAdministrationShell"
                                        :disabled="!newShell" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="identifier" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput v-model="AASIdShort" label="IdShort" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="idShort" />
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
                                        v-model="AASCategory"
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
                    <!-- Derivation -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Derivation</v-expansion-panel-title>
                        <v-expansion-panel-text class="pt-2">
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Asset -->
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Asset</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center" class="mb-3">
                                <v-col class="py-0">
                                    <SelectInput v-model="assetKind" label="Asset Kind" type="assetKind"></SelectInput>
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="assetKind" />
                                </v-col>
                            </v-row>
                            <AssetIdInput
                                v-model:global-asset-id="globalAssetId"
                                v-model:specific-asset-ids="specificAssetIds"
                                :show-specific-asset-ids="true"
                                :show-generate-iri-for-global="true"
                                :show-generate-iri-for-specific="true" />
                            <v-row align="center" class="mt-0">
                                <v-col class="py-0">
                                    <TextInput v-model="assetType" label="Asset Type" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="assetType" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ResourceInput
                                        v-model="defaultThumbnail"
                                        label="Default Thumbnail"
                                        :new-shell="newShell"
                                        :aas="aas"
                                        @update:file-thumbnail="handleFileThumbnail" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="defaultThumbnail" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" @click="saveAAS">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    const props = defineProps<{
        modelValue: boolean;
        newShell: boolean;
        aas?: aasTypes.AssetAdministrationShell;
    }>();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { generateUUID } = useIDUtils();
    const { getAasEndpointById, fetchAndDispatchAasById } = useAASHandling();

    // Stores
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const { fetchAasById, postAas, putAas, putThumbnail } = useAASRepositoryClient();
    const { fetchAasDescriptorById, putAasDescriptor, createDescriptorFromAAS } = useAASRegistryClient();

    const editAASDialog = ref(false);
    const AASObject = ref<aasTypes.AssetAdministrationShell | undefined>(undefined);
    const openPanels = ref<number[]>([0, 3]);

    const AASId = ref<string | null>(generateUUID());
    const AASIdShort = ref<string | null>(null);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const AASCategory = ref<string | null>(null);

    const version = ref<string | null>(null);
    const revision = ref<string | null>(null);
    const creator = ref<aasTypes.Reference | null>(null);
    const templateId = ref<string | null>(null);

    const assetKind = ref<aasTypes.AssetKind>(aasTypes.AssetKind.Instance);
    const globalAssetId = ref<string | null>(null);
    const specificAssetIds = ref<Array<aasTypes.SpecificAssetId> | null>(null);
    const assetType = ref<string | null>(null);
    const defaultThumbnail = ref<aasTypes.Resource | null>(null);

    const fileThumbnail = ref<File | undefined>(undefined);

    // Computed Properties
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
                    border = 'border-t-thin';
                }
                break;
        }
        return border;
    });

    watch(
        () => props.modelValue,
        (value) => {
            editAASDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editAASDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function initializeInputs(): Promise<void> {
        if (props.newShell === false && props.aas) {
            const aas = await fetchAasById(props.aas.id);

            // Parse JSON to AssetAdministrationShell
            const instanceOrError = jsonization.assetAdministrationShellFromJsonable(aas);
            if (instanceOrError.error !== null) {
                console.error('Error parsing AAS: ', instanceOrError.error);
                return;
            }
            AASObject.value = instanceOrError.mustValue();
            // console.log('AASObject: ', AASObject.value);
            // Set values of AAS
            AASId.value = AASObject.value.id;
            AASIdShort.value = AASObject.value.idShort;
            displayName.value = AASObject.value.displayName;
            description.value = AASObject.value.description;
            AASCategory.value = AASObject.value.category;
            if (AASObject.value.administration !== null && AASObject.value.administration !== undefined) {
                version.value = AASObject.value.administration.version;
                revision.value = AASObject.value.administration.revision;
                creator.value = AASObject.value.administration.creator;
                templateId.value = AASObject.value.administration.templateId;
            }
            if (AASObject.value.assetInformation !== null && AASObject.value.assetInformation !== undefined) {
                assetKind.value = AASObject.value.assetInformation.assetKind;
                globalAssetId.value = AASObject.value.assetInformation.globalAssetId;
                specificAssetIds.value = AASObject.value.assetInformation.specificAssetIds;
                assetType.value = AASObject.value.assetInformation.assetType;
                defaultThumbnail.value = AASObject.value.assetInformation.defaultThumbnail;
            }
        }
    }

    function createAssetInformation(): aasTypes.AssetInformation {
        const assetInformation = new aasTypes.AssetInformation(assetKind.value);

        // Add optional parameter globalAssetId
        if (globalAssetId.value !== null) {
            assetInformation.globalAssetId = globalAssetId.value;
        }

        // Add optional parameter specificAssetIds
        if (specificAssetIds.value !== null && specificAssetIds.value.length > 0) {
            assetInformation.specificAssetIds = specificAssetIds.value;
        }

        // Add optional parameter assetType
        if (assetType.value !== null) {
            assetInformation.assetType = assetType.value;
        }

        if (defaultThumbnail.value !== null) {
            assetInformation.defaultThumbnail = defaultThumbnail.value;
        }

        return assetInformation;
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

    async function saveAAS(): Promise<void> {
        if (AASId.value === null) return;

        const assetInformation = createAssetInformation();

        const administrativeInformation = createAdministrativeInformation();

        // Create new AAS if newShell is true
        if (props.newShell || AASObject.value === undefined) {
            AASObject.value = new aasTypes.AssetAdministrationShell(AASId.value, assetInformation);
        } else {
            // Update existing AAS
            AASObject.value.assetInformation = assetInformation;
        }

        // Add optional parameter category
        AASObject.value.category = AASCategory.value;

        // Add optional parameter idShort
        if (AASIdShort.value !== null) {
            AASObject.value.idShort = AASIdShort.value;
        }

        // Add optional parameter displayName
        if (displayName.value !== null) {
            AASObject.value.displayName = displayName.value;
        }

        // Add optional parameter description
        if (description.value !== null) {
            AASObject.value.description = description.value;
        }

        // Add optional parameter administration
        if (Object.values(administrativeInformation).some((value) => value !== null)) {
            AASObject.value.administration = administrativeInformation;
        }

        // TODO: Add optional parameter derivedFrom

        // embeddedDataSpecifications are out of scope
        // extensions are out of scope
        // TODO Add Submodels

        if (props.newShell) {
            // Create new AAS
            await postAas(AASObject.value);
            // Upload default thumbnail
            if (fileThumbnail.value !== undefined) {
                await putThumbnail(fileThumbnail.value, AASObject.value.id);
            }

            const query = structuredClone(route.query);
            query.aas = await getAasEndpointById(AASObject.value.id);
            if (Object.hasOwn(query, 'path')) delete query.path;

            router.push({ query: query });
            navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
        } else {
            // Update existing AAS
            await putAas(AASObject.value);
            // Update AAS Descriptor
            const jsonAAS = jsonization.toJsonable(AASObject.value);
            // Fetch existing descriptor to preserve endpoints
            const existingDescriptor = await fetchAasDescriptorById(AASObject.value.id);
            const endpoints = existingDescriptor?.endpoints ?? [];
            const descriptor = createDescriptorFromAAS(jsonAAS, endpoints);
            await putAasDescriptor(descriptor);
            // Upload default thumbnail
            if (fileThumbnail.value !== undefined) {
                await putThumbnail(fileThumbnail.value, AASObject.value.id);
            }
            if (AASObject.value.id === selectedAAS.value.id) {
                await fetchAndDispatchAasById(AASObject.value.id);
            }
            navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
        }
        clearForm();
        editAASDialog.value = false;
    }

    function closeDialog(): void {
        clearForm();
        editAASDialog.value = false;
    }

    function clearForm(): void {
        // Reset all values
        AASId.value = generateUUID();
        AASIdShort.value = null;
        displayName.value = null;
        description.value = null;
        AASCategory.value = null;
        version.value = null;
        revision.value = null;
        creator.value = null;
        templateId.value = null;
        assetKind.value = aasTypes.AssetKind.Instance;
        globalAssetId.value = null;
        specificAssetIds.value = null;
        assetType.value = null;
        defaultThumbnail.value = null;
        // Reset state of expansion panels
        openPanels.value = [0, 3];
    }

    function handleFileThumbnail(file: File | undefined): void {
        fileThumbnail.value = file;
    }
</script>
