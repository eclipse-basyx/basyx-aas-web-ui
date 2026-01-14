<template>
    <v-container max-width="1500">
        <v-card>
            <v-card-title align="center">AAS Importer</v-card-title>
            <v-divider />
            <v-card-text>
                <v-text-field
                    id="asset-id-input"
                    v-model="assetId"
                    density="compact"
                    variant="outlined"
                    label="Global Asset ID of the AAS to Import"
                    prepend-inner-icon="mdi-qrcode"
                    :error="assetId.length == 0"
                    class="mb-4">
                </v-text-field>
                <v-select
                    v-model="selectedInfrastructureId"
                    :items="infrastructureItems"
                    item-title="label"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    label="Source Infrastructure with AAS Discovery"
                    no-data-text="No Infrastructure with an AAS Discovery configured"
                    placeholder="Please select..."
                    prepend-inner-icon="mdi-server-network"
                    :error="isSourceSameAsDestination()"
                    clearable>
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #subtitle>
                                <span class="text-caption">{{ item.raw.discoveryUrl }}</span>
                            </template>
                        </v-list-item>
                    </template>
                </v-select>
                <v-row>
                    <v-col cols="12" align="center" class="mt-n5">
                        <v-icon size="48" color="grey">mdi-arrow-down-thick</v-icon>
                    </v-col>
                </v-row>

                <v-select
                    v-model="selectedDestinationInfrastructureId"
                    :items="destinationInfrastructureItems"
                    item-title="label"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    label="Destination Infrastructure with AAS Repository"
                    no-data-text="No Infrastructure with an AAS Repository configured"
                    placeholder="Please select..."
                    prepend-inner-icon="mdi-download"
                    clearable
                    :error="isSourceSameAsDestination()"
                    class="mb-4">
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #subtitle>
                                <span class="text-caption">{{ item.raw.aasRepoUrl }}</span>
                            </template>
                        </v-list-item>
                    </template>
                </v-select>

                <v-alert class="mb-6">
                    <template #prepend>
                        <v-icon color="info" size="x-small">mdi-information</v-icon>
                    </template>
                    When clicking 'Import', the AAS along with its Submodels and Concept Descriptions (if configured)
                    will be fetched from the selected infrastructure and uploaded to your configured Infrastructure.
                </v-alert>

                <v-alert v-if="assetId.length == 0" class="mb-6">
                    <template #prepend>
                        <v-icon color="error" size="x-small">mdi-information</v-icon>
                    </template>
                    Global Asset ID cannot be empty. Please provide a valid Asset ID.
                </v-alert>
                <v-alert v-if="isSourceSameAsDestination()" class="mb-6">
                    <template #prepend>
                        <v-icon color="error" size="x-small">mdi-information</v-icon>
                    </template>
                    Source and Destination Infrastructure cannot be the same. Please select different infrastructures.
                </v-alert>
                <v-btn
                    color="primary"
                    block
                    class="text-buttonText"
                    :loading="loading"
                    :disabled="isSourceSameAsDestination()"
                    @click="startImport"
                    >Import</v-btn
                >
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, onMounted, ref } from 'vue';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';

    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    const assetId = ref<string>('');
    const selectedInfrastructureId = ref<string | null>(null);
    const selectedDestinationInfrastructureId = ref<string | null>(null);
    const loading = ref<boolean>(false);

    const { getAasId } = useAASDiscoveryClient();
    const { getAasEndpointById } = useAASRegistryClient();
    const { getSmEndpointById } = useSMRegistryClient();
    const { fetchAas, postAas } = useAASRepositoryClient();
    const { fetchSm, postSubmodel } = useSMRepositoryClient();
    const { fetchAllConceptDescriptions } = useSMHandling();

    // Computed property to get the selected infrastructure object (for future use in import operations)
    const selectedInfrastructure = computed(() => {
        if (!selectedInfrastructureId.value) return null;
        return (
            infrastructureStore.getInfrastructures.find((infra) => infra.id === selectedInfrastructureId.value) || null
        );
    });

    // Get default infrastructure for upload
    const defaultInfrastructure = computed(() => {
        return infrastructureStore.getInfrastructures.find((infra) => infra.isDefault) || null;
    });

    // Get selected destination infrastructure
    const destinationInfrastructure = computed(() => {
        if (!selectedDestinationInfrastructureId.value) return null;
        return (
            infrastructureStore.getInfrastructures.find(
                (infra) => infra.id === selectedDestinationInfrastructureId.value
            ) || null
        );
    });

    // Pre-select default infrastructure when component mounts
    onMounted(() => {
        if (defaultInfrastructure.value) {
            selectedDestinationInfrastructureId.value = defaultInfrastructure.value.id;
        }
    });

    // Filter infrastructures that have AASDiscovery configured
    const infrastructureItems = computed(() => {
        return infrastructureStore.getInfrastructures
            .filter((infra) => {
                const discoveryUrl = infra.components.AASDiscovery.url;
                return discoveryUrl && discoveryUrl.trim() !== '';
            })
            .map((infra) => ({
                id: infra.id,
                label: infra.name,
                discoveryUrl: infra.components.AASDiscovery.url,
            }));
    });

    // Filter infrastructures that have AAS Repository configured
    const destinationInfrastructureItems = computed(() => {
        return infrastructureStore.getInfrastructures
            .filter((infra) => {
                const aasRepoUrl = infra.components.AASRepo.url;
                return aasRepoUrl && aasRepoUrl.trim() !== '';
            })
            .map((infra) => ({
                id: infra.id,
                label: infra.name + (infra.isDefault ? ' (Default)' : ''),
                aasRepoUrl: infra.components.AASRepo.url,
            }));
    });

    async function startImport(): Promise<void> {
        const originalInfraId = infrastructureStore.getSelectedInfrastructureId;

        loading.value = true;
        try {
            // Validate selections
            if (!selectedInfrastructure.value) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Please select a source infrastructure',
                });
                loading.value = false;
                return;
            }

            if (!destinationInfrastructure.value) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Please select a destination infrastructure',
                });
                loading.value = false;
                return;
            }

            await infrastructureStore.dispatchSelectInfrastructure(selectedInfrastructure.value.id);

            // Step 1: Fetch AAS ID from Discovery
            const aasId = await getAasId(assetId.value, selectedInfrastructure?.value?.components.AASDiscovery.url);
            // console.log('Discovered AAS ID:', aasId);

            // Step 2: Get AAS Endpoint
            let url = selectedInfrastructure?.value?.components.AASRepo.url.endsWith('/shells')
                ? selectedInfrastructure?.value?.components.AASRepo.url
                : selectedInfrastructure?.value?.components.AASRepo.url + '/shells';
            let aasEndpoint = url + '/' + base64Encode(aasId);

            if (selectedInfrastructure?.value?.components.AASRegistry.url.trim() !== '') {
                aasEndpoint = await getAasEndpointById(
                    aasId,
                    selectedInfrastructure?.value?.components.AASRegistry.url
                );
            }

            // Step 3: Fetch AAS
            const aas = await fetchAas(aasEndpoint);
            const submodels = [];
            const conceptDescriptions = [];
            // console.log('Imported AAS:', aas);

            // Step 4: Fetch all Submodels
            if (aas.submodels && Array.isArray(aas.submodels)) {
                for (let i = 0; i < aas.submodels.length; i++) {
                    const submodelRef = aas.submodels[i];
                    try {
                        if (submodelRef.keys.length === 0) continue;
                        const smId = submodelRef.keys[0].value;

                        let smEndpoint = selectedInfrastructure?.value?.components.SubmodelRepo.url.endsWith(
                            '/submodels'
                        )
                            ? selectedInfrastructure?.value?.components.SubmodelRepo.url
                            : selectedInfrastructure?.value?.components.SubmodelRepo.url + '/submodels';
                        smEndpoint += '/' + base64Encode(smId);

                        if (selectedInfrastructure?.value?.components.SubmodelRegistry.url.trim() !== '') {
                            smEndpoint = await getSmEndpointById(
                                smId,
                                selectedInfrastructure?.value?.components.SubmodelRegistry.url
                            );
                        }

                        const submodel = await fetchSm(smEndpoint);

                        // Fetch Concept Descriptions if configured
                        const cdRepoUrl = selectedInfrastructure?.value?.components.ConceptDescriptionRepo.url.trim();
                        if (cdRepoUrl !== '') {
                            const cds = await fetchAllConceptDescriptions(submodel, smEndpoint, cdRepoUrl);
                            if (cds && cds.length > 0) {
                                conceptDescriptions.push(...cds);
                            }
                        }

                        submodels.push(submodel);
                    } catch (error) {
                        console.error('Error fetching Submodel:', error);
                    }
                }
            }
            // console.log('Switching Infrastructure to Destination for Upload:', destinationInfrastructure.value.name);
            await infrastructureStore.dispatchSelectInfrastructure(destinationInfrastructure.value.id);
            delete aas.endpoints;

            // Step 6: Upload AAS to default infrastructure
            const instanceOrError = jsonization.assetAdministrationShellFromJsonable(aas);
            if (instanceOrError.error !== null) {
                console.error('Converting AAS Failed during Instantiation: ', instanceOrError.error);
            }
            const coreworksAAS = instanceOrError.mustValue();
            const aasUploaded = await postAas(coreworksAAS);
            if (!aasUploaded) {
                throw new Error('Failed to upload AAS to default infrastructure');
            }

            // Step 7: Upload Submodels
            let submodelsUploaded = 0;
            for (const submodel of submodels) {
                const instanceOrError = jsonization.submodelFromJsonable(submodel);
                if (instanceOrError.error !== null) {
                    throw new Error('Converting AAS Failed during Instantiation: ' + instanceOrError.error);
                }
                const coreworksSubmodel = instanceOrError.mustValue();
                const success = await postSubmodel(coreworksSubmodel);
                if (success) {
                    submodelsUploaded++;
                }
            }

            // Step 8: Restore original infrastructure selection
            if (originalInfraId && destinationInfrastructure.value.id !== originalInfraId) {
                await infrastructureStore.dispatchSelectInfrastructure(originalInfraId);
            }

            // Step 9: Show success message
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'success',
                btnColor: 'buttonText',
                text: `Successfully imported AAS with ${submodelsUploaded}/${submodels.length} Submodels to ${destinationInfrastructure.value.name}`,
                extendedError:
                    conceptDescriptions.length > 0
                        ? `Note: ${conceptDescriptions.length} Concept Descriptions were fetched but not uploaded (no POST endpoint available).`
                        : undefined,
            });
        } catch (error) {
            console.error('Error during import:', error);
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Import failed',
                extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            loading.value = false;
        }
    }

    function isSourceSameAsDestination(): boolean {
        if (selectedInfrastructureId.value === null || selectedDestinationInfrastructureId.value === null) {
            return false;
        }
        return selectedInfrastructureId.value === selectedDestinationInfrastructureId.value;
    }
</script>

<script lang="ts">
    import type { PageShortcutDefinitions } from '@/composables/Shortcuts/useRouteShortcuts';

    // Module shortcuts definition - available when this module is active
    export const shortcuts: PageShortcutDefinitions = () => [
        {
            id: 'aas-importer-clear-asset-id',
            title: 'Clear Asset ID',
            description: 'Clear the asset ID input field',
            prependIcon: 'mdi-eraser',
            category: 'AAS Importer Shortcuts',
            keys: 'cmd+shift+backspace',
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                const assetIdInput = document.querySelector('#asset-id-input input') as HTMLInputElement;
                if (assetIdInput) {
                    assetIdInput.value = '';
                    assetIdInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            },
        },
    ];
</script>
