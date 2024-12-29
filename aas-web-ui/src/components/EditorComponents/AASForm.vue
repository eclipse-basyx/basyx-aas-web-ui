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
    <v-dialog v-model="editAASDialog" width="860">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newAAS ? 'Create a new AAS' : 'Edit AAS' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel>
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-text-field
                                v-model="AASId"
                                label="ID"
                                variant="outlined"
                                density="compact"></v-text-field>
                            <v-text-field
                                v-model="AASIdShort"
                                label="IdShort"
                                variant="outlined"
                                density="compact"></v-text-field>
                            <!-- <v-text-field v-model="AASObject.description" label="Description" variant="outlined" density="compact"></v-text-field>
                            <v-text-field v-model="AASObject.description" label="Display Name" variant="outlined" density="compact"></v-text-field> -->
                            <v-select
                                v-model="AASCategory"
                                :items="categoryOptions"
                                label="Category"
                                variant="outlined"
                                density="compact"></v-select>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Administrative Information -->
                    <v-expansion-panel></v-expansion-panel>
                    <!-- Derivation -->
                    <v-expansion-panel></v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-title>Asset</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-select
                                v-model="assetKind"
                                :items="assetKindOptions"
                                item-title="text"
                                item-value="value"
                                label="Asset Kind"
                                variant="outlined"
                                density="compact"></v-select>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="editAASDialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="saveAAS">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { ref } from 'vue';

    const props = defineProps<{
        newAAS: boolean;
    }>();

    const editAASDialog = ref(false);
    const AASObject = ref<aasTypes.AssetAdministrationShell | undefined>(undefined);
    const openPanels = ref<number[]>([0, 3]);
    const categoryOptions = ref<string[]>(['Constant', 'Parameter', 'Variable']);
    const assetKindOptions = ref([
        { text: 'Instance', value: aasTypes.AssetKind.Instance },
        { text: 'Type', value: aasTypes.AssetKind.Type },
        { text: 'Not Applicable', value: aasTypes.AssetKind.NotApplicable },
    ]);

    const AASId = ref<string | null>(null);
    const AASIdShort = ref<string | null>(null);
    const AASCategory = ref<string | null>(null);

    const assetKind = ref<aasTypes.AssetKind>(aasTypes.AssetKind.Instance);

    function saveAAS() {
        if (!AASObject.value || AASId.value === null) return;
        if (props.newAAS) {
            // Create new Asset Information object
            const assetInformation = new aasTypes.AssetInformation(assetKind.value);

            // Add optional parameter globalAssetId

            // Add optional parameter specificAssetIds

            // Add optional parameter assetType

            // Add optional parameter defaultThumbnail

            // Create new AAS
            AASObject.value = new aasTypes.AssetAdministrationShell(AASId.value, assetInformation);

            // Add optional parameter extensions

            // Add optional parameter category
            if (AASCategory.value !== null) {
                AASObject.value.category = AASCategory.value;
            }

            // Add optional parameter idShort

            // Add optional parameter displayName

            // Add optional parameter description

            // Add optional parameter administration

            // Add optional parameter embeddedDataSpecifications

            // Add optional parameter derivedFrom

            // Add optional parameter submodels
        }
        editAASDialog.value = false;
    }
</script>
