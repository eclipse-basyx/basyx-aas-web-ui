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
                            <TextInput
                                v-if="newShell"
                                v-model="AASId"
                                label="ID"
                                :show-generate-iri-button="true"
                                type="AssetAdministrationShell" />
                            <TextInput v-model="AASIdShort" label="IdShort" />
                            <MultiLanguageTextInput v-model="displayName" label="Display Name" type="displayName" />
                            <MultiLanguageTextInput v-model="description" label="Description" type="description" />
                            <SelectInput v-model="AASCategory" label="Category" type="category" :clearable="true" />
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
                            <SelectInput v-model="assetKind" label="Asset Kind" type="assetKind"></SelectInput>
                            <TextInput
                                v-model="globalAssetId"
                                label="Global Asset ID"
                                :show-generate-iri-button="true"
                                type="Asset" />
                            <TextInput v-model="assetType" label="Asset Type" />
                            <ResourceInput
                                v-model="defaultThumbnail"
                                label="Default Thumbnail"
                                :new-shell="newShell"
                                :aas="aas"
                                @update:file-thumbnail="handleFileSthumbnail" />
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
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useAASStore } from '@/store/AASDataStore';

    const props = defineProps<{
        modelValue: boolean;
        newShell: boolean;
        aas?: any;
    }>();

    // Composables
    const { UUID } = useIDUtils();
    const { fetchAndDispatchAasById } = useAASHandling();

    // Stores
    const aasStore = useAASStore();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const { fetchAasById, postAas, putAas, putThumbnail } = useAASRepositoryClient();
    const { putAasDescriptor, createDescriptorFromAAS } = useAASRegistryClient();

    const editAASDialog = ref(false);
    const AASObject = ref<aasTypes.AssetAdministrationShell | undefined>(undefined);
    const openPanels = ref<number[]>([0, 3]);

    const AASId = ref<string | null>(UUID());
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

    async function initializeInputs() {
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

        // TODO: Add optional parameter specificAssetIds

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
        if (AASCategory.value !== null) {
            AASObject.value.category = AASCategory.value;
        }

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
        // TODO Add Submodels; wait for https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/195

        if (props.newShell) {
            // Create new AAS
            await postAas(AASObject.value);
            // Upload default thumbnail
            if (fileThumbnail.value !== undefined) {
                await putThumbnail(fileThumbnail.value, AASObject.value.id);
            }
            await fetchAndDispatchAasById(AASObject.value.id);
        } else {
            // Update existing AAS
            await putAas(AASObject.value);
            // Update AAS Descriptor
            const jsonAAS = jsonization.toJsonable(AASObject.value);
            const descriptor = createDescriptorFromAAS(jsonAAS, props.aas.endpoints);
            await putAasDescriptor(descriptor);
            // Upload default thumbnail
            if (fileThumbnail.value !== undefined) {
                await putThumbnail(fileThumbnail.value, AASObject.value.id);
            }
            if (AASObject.value.id === selectedAAS.value.id) {
                await fetchAndDispatchAasById(AASObject.value.id);
            }
        }
        clearForm();
        editAASDialog.value = false;
    }

    function closeDialog() {
        clearForm();
        editAASDialog.value = false;
    }

    function clearForm() {
        // Reset all values
        AASId.value = UUID();
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
        assetType.value = null;
        defaultThumbnail.value = null;
        // Reset state of expansion panels
        openPanels.value = [0, 3];
    }

    function handleFileSthumbnail(file: File | undefined) {
        fileThumbnail.value = file;
    }
</script>
