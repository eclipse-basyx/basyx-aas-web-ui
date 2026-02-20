<template>
    <v-container max-width="1500">
        <v-card border rounded="lg">
            <v-card-title class="bg-cardHeader">
                <v-icon icon="mdi-swap-vertical" />
                <span class="ml-3">AAS Importer</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-btn-toggle v-model="importMode" mandatory class="mb-4" border density="compact">
                    <v-btn value="assetId">Asset ID</v-btn>
                    <v-btn value="aasId">AAS ID</v-btn>
                </v-btn-toggle>
                <v-text-field
                    id="asset-id-input"
                    v-model="importIdentifier"
                    density="compact"
                    variant="outlined"
                    :label="inputLabel"
                    prepend-inner-icon="mdi-qrcode"
                    :error="isInputEmpty"
                    class="mb-4">
                </v-text-field>
                <v-select
                    v-model="selectedInfrastructureId"
                    :items="infrastructureItems"
                    item-title="label"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    :label="sourceInfrastructureLabel"
                    :no-data-text="sourceInfrastructureNoDataText"
                    placeholder="Please select..."
                    prepend-inner-icon="mdi-server-network"
                    :error="isSourceSameAsDestination()"
                    clearable>
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #subtitle>
                                <span class="text-caption">{{ item.raw.sourceUrl }}</span>
                            </template>
                        </v-list-item>
                    </template>
                </v-select>
                <v-checkbox
                    v-model="sourceUseSuperpath"
                    density="compact"
                    hide-details
                    class="mt-n2 mb-2"
                    label="Use AAS superpath endpoints for source Submodels" />
                <v-select
                    v-if="isAssetIdMode && discoveredAasIds.length > 1"
                    v-model="selectedDiscoveredAasId"
                    :items="discoveredAasIds"
                    density="compact"
                    variant="outlined"
                    label="Discovered AAS IDs"
                    no-data-text="No discovered AAS IDs available"
                    placeholder="Please select one AAS ID..."
                    prepend-inner-icon="mdi-format-list-bulleted"
                    :error="selectedDiscoveredAasId === null"
                    clearable
                    class="mb-4" />
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
                <v-checkbox
                    v-model="destinationUseSuperpath"
                    density="compact"
                    hide-details
                    class="mt-n2 mb-4"
                    label="Use AAS superpath endpoints for destination Submodels" />

                <v-alert class="mb-6" border="start">
                    <template #prepend>
                        <v-icon color="info" size="x-small">mdi-information</v-icon>
                    </template>
                    When clicking 'Import', the AAS along with its Submodels and Concept Descriptions (if configured)
                    will be fetched from the selected infrastructure and uploaded to your configured Infrastructure.
                </v-alert>

                <v-alert v-if="isInputEmpty" class="mb-6" border="start">
                    <template #prepend>
                        <v-icon color="error" size="x-small">mdi-information</v-icon>
                    </template>
                    {{ inputEmptyErrorText }}
                </v-alert>
                <v-alert
                    v-if="isAssetIdMode && discoveredAasIds.length > 1 && selectedDiscoveredAasId === null"
                    class="mb-6"
                    border="start">
                    <template #prepend>
                        <v-icon color="error" size="x-small">mdi-information</v-icon>
                    </template>
                    Multiple AAS IDs were found for the provided Asset ID. Please select one AAS ID.
                </v-alert>
                <v-alert v-if="isSourceSameAsDestination()" class="mb-6" border="start">
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
                    :disabled="isImportDisabled"
                    @click="startImport"
                    >Import</v-btn
                >
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { jsonization } from '@aas-core-works/aas-core3.1-typescript';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';

    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'AAS Importer',
    });

    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    type ImportMode = 'assetId' | 'aasId';

    const importMode = ref<ImportMode>('assetId');
    const importIdentifier = ref<string>('');
    const discoveredAasIds = ref<string[]>([]);
    const selectedDiscoveredAasId = ref<string | null>(null);
    const selectedInfrastructureId = ref<string | null>(null);
    const selectedDestinationInfrastructureId = ref<string | null>(null);
    const sourceUseSuperpath = ref<boolean>(false);
    const destinationUseSuperpath = ref<boolean>(false);
    const loading = ref<boolean>(false);

    const { getAasIds } = useAASDiscoveryClient();
    const { getAasEndpointById } = useAASRegistryClient();
    const { getSmEndpointById } = useSMRegistryClient();
    const { fetchAas, postAas } = useAASRepositoryClient();
    const { fetchSm, postSubmodel } = useSMRepositoryClient();
    const { postRequest } = useRequestHandling();
    const { fetchAllConceptDescriptions } = useSMHandling();

    const isAssetIdMode = computed(() => importMode.value === 'assetId');
    const isInputEmpty = computed(() => importIdentifier.value.trim().length === 0);
    const inputLabel = computed(() =>
        isAssetIdMode.value ? 'Global Asset ID of the AAS to Import' : 'AAS ID of the AAS to Import'
    );
    const inputEmptyErrorText = computed(() =>
        isAssetIdMode.value
            ? 'Global Asset ID cannot be empty. Please provide a valid Asset ID.'
            : 'AAS ID cannot be empty. Please provide a valid AAS ID.'
    );
    const sourceInfrastructureLabel = computed(() =>
        isAssetIdMode.value ? 'Source Infrastructure with AAS Discovery' : 'Source Infrastructure with AAS Repository'
    );
    const sourceInfrastructureNoDataText = computed(() =>
        isAssetIdMode.value
            ? 'No Infrastructure with an AAS Discovery configured'
            : 'No Infrastructure with an AAS Repository configured'
    );

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

    function hasConfiguredSubmodelRepo(infra: (typeof infrastructureStore.getInfrastructures)[number] | null): boolean {
        if (!infra) return false;
        const submodelRepoUrl = infra.components.SubmodelRepo.url;
        return submodelRepoUrl !== null && submodelRepoUrl.trim() !== '';
    }

    // Filter source infrastructures based on selected import mode
    const infrastructureItems = computed(() => {
        return infrastructureStore.getInfrastructures
            .filter((infra) => {
                if (isAssetIdMode.value) {
                    const discoveryUrl = infra.components.AASDiscovery.url;
                    return discoveryUrl && discoveryUrl.trim() !== '';
                }
                const aasRepoUrl = infra.components.AASRepo.url;
                return aasRepoUrl && aasRepoUrl.trim() !== '';
            })
            .map((infra) => ({
                id: infra.id,
                label: infra.name,
                sourceUrl: isAssetIdMode.value ? infra.components.AASDiscovery.url : infra.components.AASRepo.url,
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

    const isImportDisabled = computed(() => {
        return (
            loading.value ||
            isSourceSameAsDestination() ||
            isInputEmpty.value ||
            selectedInfrastructure.value === null ||
            destinationInfrastructure.value === null ||
            (isAssetIdMode.value && discoveredAasIds.value.length > 1 && selectedDiscoveredAasId.value === null)
        );
    });

    watch([importMode, importIdentifier, selectedInfrastructureId], () => {
        discoveredAasIds.value = [];
        selectedDiscoveredAasId.value = null;
    });

    watch(infrastructureItems, () => {
        if (
            selectedInfrastructureId.value !== null &&
            !infrastructureItems.value.some((item) => item.id === selectedInfrastructureId.value)
        ) {
            selectedInfrastructureId.value = null;
        }
    });

    watch(selectedInfrastructure, (infra) => {
        sourceUseSuperpath.value = !hasConfiguredSubmodelRepo(infra);
    });

    watch(destinationInfrastructure, (infra) => {
        destinationUseSuperpath.value = !hasConfiguredSubmodelRepo(infra);
    });

    function buildAasEndpointFromRepo(aasRepoUrl: string, aasId: string): string {
        let normalizedAasRepoUrl = aasRepoUrl.trim();
        if (normalizedAasRepoUrl.endsWith('/')) {
            normalizedAasRepoUrl = normalizedAasRepoUrl.slice(0, -1);
        }
        const shellsPath = normalizedAasRepoUrl.endsWith('/shells')
            ? normalizedAasRepoUrl
            : `${normalizedAasRepoUrl}/shells`;
        return `${shellsPath}/${base64Encode(aasId)}`;
    }

    function buildSubmodelEndpointFromSuperpath(aasEndpoint: string, submodelId: string): string {
        const normalizedAasEndpoint = aasEndpoint.endsWith('/') ? aasEndpoint.slice(0, -1) : aasEndpoint;
        return `${normalizedAasEndpoint}/submodels/${base64Encode(submodelId)}`;
    }

    async function startImport(): Promise<void> {
        const originalInfraId = infrastructureStore.getSelectedInfrastructureId;

        loading.value = true;
        try {
            const trimmedImportIdentifier = importIdentifier.value.trim();

            if (trimmedImportIdentifier === '') {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: isAssetIdMode.value ? 'Please provide a Global Asset ID' : 'Please provide an AAS ID',
                });
                return;
            }

            // Validate selections
            if (!selectedInfrastructure.value) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Please select a source infrastructure',
                });
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
                return;
            }

            if (isSourceSameAsDestination()) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Source and Destination Infrastructure cannot be the same',
                });
                return;
            }

            await infrastructureStore.dispatchSelectInfrastructure(selectedInfrastructure.value.id);

            let aasId = '';

            if (isAssetIdMode.value) {
                if (discoveredAasIds.value.length > 1) {
                    if (!selectedDiscoveredAasId.value) {
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 5000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Please select one of the discovered AAS IDs',
                        });
                        return;
                    }
                    aasId = selectedDiscoveredAasId.value;
                } else {
                    const sourceDiscoveryUrl = selectedInfrastructure.value.components.AASDiscovery.url;
                    const discoveredIds = await getAasIds(trimmedImportIdentifier, sourceDiscoveryUrl);

                    if (discoveredIds.length === 0) {
                        throw new Error('No AAS found for the provided Global Asset ID');
                    }

                    if (discoveredIds.length > 1) {
                        discoveredAasIds.value = discoveredIds;
                        selectedDiscoveredAasId.value = null;
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 7000,
                            color: 'warning',
                            btnColor: 'buttonText',
                            text: 'Multiple AAS IDs were found. Please select one AAS ID and click Import again.',
                        });
                        return;
                    }

                    aasId = discoveredIds[0];
                }
            } else {
                aasId = trimmedImportIdentifier;
                discoveredAasIds.value = [];
                selectedDiscoveredAasId.value = null;
            }

            if (aasId.trim() === '') {
                throw new Error('Could not resolve a valid AAS ID for import');
            }

            const sourceAasRepoUrl = selectedInfrastructure.value.components.AASRepo.url.trim();
            if (sourceAasRepoUrl === '') {
                throw new Error('Selected source infrastructure has no AAS Repository configured');
            }

            // Step 1: Get AAS Endpoint
            let aasEndpoint = buildAasEndpointFromRepo(sourceAasRepoUrl, aasId);

            if (selectedInfrastructure?.value?.components.AASRegistry.url.trim() !== '') {
                aasEndpoint = await getAasEndpointById(
                    aasId,
                    selectedInfrastructure?.value?.components.AASRegistry.url
                );
            }

            // Step 2: Fetch AAS
            const aas = await fetchAas(aasEndpoint);
            const submodels = [];
            const conceptDescriptions = [];

            // Step 3: Fetch all Submodels
            if (aas.submodels && Array.isArray(aas.submodels)) {
                for (let i = 0; i < aas.submodels.length; i++) {
                    const submodelRef = aas.submodels[i];
                    try {
                        if (submodelRef.keys.length === 0) continue;
                        const smId = submodelRef.keys[0].value;

                        let smEndpoint = '';
                        if (sourceUseSuperpath.value) {
                            smEndpoint = buildSubmodelEndpointFromSuperpath(aasEndpoint, smId);
                        } else {
                            const sourceSubmodelRepoUrl =
                                selectedInfrastructure?.value?.components.SubmodelRepo.url.trim();
                            if (sourceSubmodelRepoUrl === '') {
                                throw new Error(
                                    'Source infrastructure has no Submodel Repository configured and source superpath is disabled'
                                );
                            }
                            smEndpoint = sourceSubmodelRepoUrl.endsWith('/submodels')
                                ? sourceSubmodelRepoUrl
                                : sourceSubmodelRepoUrl + '/submodels';
                            smEndpoint += '/' + base64Encode(smId);
                        }

                        if (
                            !sourceUseSuperpath.value &&
                            selectedInfrastructure?.value?.components.SubmodelRegistry.url.trim() !== ''
                        ) {
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

            await infrastructureStore.dispatchSelectInfrastructure(destinationInfrastructure.value.id);
            delete aas.endpoints;

            const destinationAasRepoUrl = destinationInfrastructure.value.components.AASRepo.url.trim();
            if (destinationAasRepoUrl === '') {
                throw new Error('Selected destination infrastructure has no AAS Repository configured');
            }

            let destinationAasEndpoint = buildAasEndpointFromRepo(destinationAasRepoUrl, aasId);
            if (destinationInfrastructure.value.components.AASRegistry.url.trim() !== '') {
                destinationAasEndpoint = await getAasEndpointById(
                    aasId,
                    destinationInfrastructure.value.components.AASRegistry.url
                );
            }

            // Step 4: Upload AAS to destination infrastructure
            const instanceOrError = jsonization.assetAdministrationShellFromJsonable(aas);
            if (instanceOrError.error !== null) {
                console.error('Converting AAS Failed during Instantiation: ', instanceOrError.error);
            }
            const coreworksAAS = instanceOrError.mustValue();
            const aasUploaded = await postAas(coreworksAAS);
            if (!aasUploaded) {
                throw new Error('Failed to upload AAS to destination infrastructure');
            }

            // Step 5: Upload Submodels
            let submodelsUploaded = 0;
            for (const submodel of submodels) {
                const instanceOrError = jsonization.submodelFromJsonable(submodel);
                if (instanceOrError.error !== null) {
                    throw new Error('Converting AAS Failed during Instantiation: ' + instanceOrError.error);
                }
                const coreworksSubmodel = instanceOrError.mustValue();
                let success = false;

                if (destinationUseSuperpath.value) {
                    const path = `${destinationAasEndpoint.endsWith('/') ? destinationAasEndpoint.slice(0, -1) : destinationAasEndpoint}/submodels`;
                    const headers = new Headers();
                    headers.append('Content-Type', 'application/json');
                    const body = JSON.stringify(jsonization.toJsonable(coreworksSubmodel));
                    const context = 'creating Submodel via AAS superpath';
                    const disableMessage = false;
                    const response = await postRequest(path, body, headers, context, disableMessage);
                    success = response?.success === true;
                } else {
                    success = await postSubmodel(coreworksSubmodel);
                }

                if (success) {
                    submodelsUploaded++;
                }
            }

            // Step 6: Show success message
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
            if (originalInfraId && infrastructureStore.getSelectedInfrastructureId !== originalInfraId) {
                await infrastructureStore.dispatchSelectInfrastructure(originalInfraId);
            }
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
            title: 'Clear Import ID',
            description: 'Clear the import ID input field',
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
