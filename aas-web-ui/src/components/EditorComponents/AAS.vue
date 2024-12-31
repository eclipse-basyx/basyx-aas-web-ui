<template>
    <v-tooltip open-delay="600" location="end">
        <template #activator="{ props }">
            <v-list-item v-if="newAAS" slim v-bind="props" @click="editAASDialog = true">
                <template #prepend>
                    <v-icon size="small">mdi-plus</v-icon>
                </template>
                Create AAS
            </v-list-item>
            <v-list-item v-else @click="editAASDialog = true">
                <template #prepend>
                    <v-icon size="x-small">mdi-pencil</v-icon>
                </template>
                <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
            </v-list-item>
        </template>
        <span>Creat a new AAS</span>
    </v-tooltip>
    <v-dialog v-model="editAASDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newAAS ? 'Create a new AAS' : 'Edit AAS' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel>
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput
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
                    <v-expansion-panel>
                        <v-expansion-panel-title>Administrative Information</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput v-model="version" label="Version" />
                            <TextInput v-model="revision" label="Revision" />
                            <ReferenceInput v-model="creator" label="Creator" />
                            <TextInput v-model="templateId" label="Template ID" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Derivation -->
                    <v-expansion-panel>
                        <v-expansion-panel-title>Derivation</v-expansion-panel-title>
                        <v-expansion-panel-text></v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Asset -->
                    <v-expansion-panel>
                        <v-expansion-panel-title>Asset</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <SelectInput v-model="assetKind" label="AssetKind" type="assetKind"></SelectInput>
                            <TextInput
                                v-model="globalAssetId"
                                label="Global Asset ID"
                                :show-generate-iri-button="true"
                                type="P" />
                            <TextInput v-model="assetType" label="Asset Type" />
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
    import { ref } from 'vue';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { UUID } from '@/utils/IDUtils';

    const props = defineProps<{
        newAAS: boolean;
    }>();

    const { postAas } = useAASRepositoryClient();

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

    function saveAAS() {
        if (AASId.value === null) return;
        if (props.newAAS) {
            // Create new Asset Information object
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

            // TODO: Add optional parameter defaultThumbnail

            // Create new Administrative Information object
            const administrativeInformation = new aasTypes.AdministrativeInformation();

            // Add optional parameter version
            if (version.value !== null) {
                administrativeInformation.version = version.value;
            }

            // Add optional parameter revision
            if (revision.value !== null) {
                administrativeInformation.revision = revision.value;
            }

            // Add optional parameter creator
            if (creator.value !== null) {
                administrativeInformation.creator = creator.value;
            }

            // Add optional parameter templateId
            if (templateId.value !== null) {
                administrativeInformation.templateId = templateId.value;
            }

            // Create new AAS
            AASObject.value = new aasTypes.AssetAdministrationShell(AASId.value, assetInformation);

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
            // Submodels are added when submodels are created
            postAas(AASObject.value);
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
        AASId.value = null;
        AASIdShort.value = null;
        AASCategory.value = null;
        version.value = null;
        revision.value = null;
        templateId.value = null;
        assetKind.value = aasTypes.AssetKind.Instance;
        globalAssetId.value = null;
        assetType.value = null;
        // Reset state of expansion panels
        openPanels.value = [0, 3];
    }
</script>
