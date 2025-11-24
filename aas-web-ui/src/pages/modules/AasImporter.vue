<template>
    <v-container max-width="1500">
        <v-card>
            <v-card-title align="center">AAS Importer</v-card-title>
            <v-divider />
            <v-card-text>
                <v-select
                    v-model="selectedInfrastructureId"
                    :items="infrastructureItems"
                    item-title="label"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    label="Infrastructure with AAS Discovery"
                    no-data-text="No Infrastructure with an AAS Discovery configured"
                    placeholder="Please select..."
                    prepend-inner-icon="mdi-server-network"
                    clearable
                    class="mb-4">
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #subtitle>
                                <span class="text-caption">{{ item.raw.discoveryUrl }}</span>
                            </template>
                        </v-list-item>
                    </template>
                </v-select>

                <v-text-field
                    v-model="assetId"
                    density="compact"
                    variant="outlined"
                    label="Global Asset ID"
                    class="mt-n5"
                    prepend-inner-icon="mdi-qrcode">
                </v-text-field>

                <v-alert v-if="defaultInfrastructure" type="info" variant="tonal" class="mb-4">
                    <template #prepend>
                        <v-icon size="small">mdi-upload</v-icon>
                    </template>
                    <div class="text-subtitle-2">Upload Destination</div>
                    <div class="text-body-2">
                        <strong>{{ defaultInfrastructure.name }}</strong>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ defaultInfrastructure.components.AASRepo.url }}
                    </div>
                </v-alert>

                <v-alert v-else type="warning" variant="tonal" class="mb-4">
                    <template #prepend>
                        <v-icon size="small">mdi-alert</v-icon>
                    </template>
                    <div class="text-body-2">
                        No default infrastructure configured. Please mark an infrastructure as default in settings.
                    </div>
                </v-alert>

                <v-alert class="mb-6">
                    <template #prepend>
                        <v-icon color="info" size="x-small">mdi-information</v-icon>
                    </template>
                    When clicking 'Import', the AAS along with its Submodels and Concept Descriptions (if configured)
                    will be fetched from the selected infrastructure and uploaded to your configured Default
                    Infrastructure.
                </v-alert>
                <!-- <v-btn class="mb-4" color="lightButton">
                    <template #prepend>
                        <v-icon size="x-small">mdi-chevron-down</v-icon>
                    </template>
                    Advanced Options
                </v-btn> -->
                <v-btn color="primary" block class="text-buttonText" :loading="loading" @click="startImport"
                    >Import</v-btn
                >
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref } from 'vue';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';

    const navigationStore = useNavigationStore();

    const assetId = ref<string>('https://acplt.org/Test_Asset');
    const selectedInfrastructureId = ref<string | null>(null);
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
        return navigationStore.getInfrastructures.find((infra) => infra.id === selectedInfrastructureId.value) || null;
    });

    // Get default infrastructure for upload
    const defaultInfrastructure = computed(() => {
        return navigationStore.getInfrastructures.find((infra) => infra.isDefault) || null;
    });

    // Filter infrastructures that have AASDiscovery configured
    const infrastructureItems = computed(() => {
        return navigationStore.getInfrastructures
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

    async function startImport(): Promise<void> {
        const originalInfraId = navigationStore.getSelectedInfrastructureId;

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

            if (!defaultInfrastructure.value) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 5000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'No default infrastructure found. Please mark an infrastructure as default.',
                });
                loading.value = false;
                return;
            }

            await navigationStore.dispatchSelectInfrastructure(selectedInfrastructure.value.id);

            // Step 1: Fetch AAS ID from Discovery
            const aasId = await getAasId(assetId.value, selectedInfrastructure?.value?.components.AASDiscovery.url);
            console.log('Discovered AAS ID:', aasId);

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
            console.log('Imported AAS:', aas);

            // Step 4: Fetch all Submodels
            for (let i = 0; i < aas.submodels.length; i++) {
                const submodelRef = aas.submodels[i];
                try {
                    if (submodelRef.keys.length === 0) continue;
                    const smId = submodelRef.keys[0].value;

                    let smEndpoint = selectedInfrastructure?.value?.components.SubmodelRepo.url.endsWith('/submodels')
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
            console.log('Switching Infrastructure to Default for Upload:', defaultInfrastructure.value.name);
            await navigationStore.dispatchSelectInfrastructure(defaultInfrastructure.value.id);
            delete aas.endpoints;

            // Step 6: Upload AAS to default infrastructure
            const instanceOrError = jsonization.assetAdministrationShellFromJsonable(aas);
            if (instanceOrError.error !== null) {
                throw new Error('Converting AAS Failed during Instantiation: ' + instanceOrError.error);
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
            if (originalInfraId && defaultInfrastructure.value.id !== originalInfraId) {
                await navigationStore.dispatchSelectInfrastructure(originalInfraId);
            }

            // Step 9: Show success message
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'success',
                btnColor: 'buttonText',
                text: `Successfully imported AAS with ${submodelsUploaded}/${submodels.length} Submodels to default infrastructure`,
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
</script>
