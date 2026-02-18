<template>
    <v-dialog v-model="uploadAASDialog" :width="800">
        <v-sheet :loading="loadingUpload" border rounded="lg">
            <v-card-title class="bg-cardHeader">Upload Shells</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
                <v-file-upload
                    v-model="aasFiles"
                    clearable
                    class="my-1"
                    density="default"
                    :multiple="true"
                    :accept="['.aasx', '.json', '.xml']"></v-file-upload>
                <!-- Options -->
                <v-label class="mt-5">Options</v-label>
                <v-radio-group v-model="uploadMode" density="compact" class="mt-4" hide-details>
                    <v-radio
                        v-for="mode in uploadModes"
                        :key="mode.value"
                        :label="mode.title"
                        :value="mode.value"
                        class="ml-2" />
                </v-radio-group>
                <v-checkbox
                    v-if="uploadMode === 'server'"
                    v-model="ignoreDuplicates"
                    label="Ignore Duplicates"
                    hide-details
                    class="mt-3"></v-checkbox>
                <v-checkbox v-model="createDescriptors" label="Also create descriptors" hide-details></v-checkbox>
                <v-alert
                    v-if="createDescriptors && !descriptorsAvailable"
                    class="mt-3"
                    type="warning"
                    density="compact">
                    Descriptor creation is unavailable because AAS and Submodel registries are not connected.
                </v-alert>
                <v-progress-linear
                    v-if="loadingUpload"
                    :model-value="uploadProgress"
                    color="primary"
                    height="12"
                    rounded
                    class="mt-4">
                    <template #default>
                        <strong>{{ Math.round(uploadProgress) }}%</strong>
                    </template>
                </v-progress-linear>
                <div v-if="loadingUpload && currentFileLabel.trim() !== ''" class="text-caption mt-2">
                    Processing: {{ currentFileLabel }}
                </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" rounded="lg" :disabled="loadingUpload" @click="uploadAASDialog = false" />
                <v-btn
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    class="text-buttonText"
                    text="Upload"
                    :loading="loadingUpload"
                    :disabled="loadingUpload || aasFiles.length === 0"
                    @click="uploadAASFiles" />
            </v-card-actions>
        </v-sheet>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { jsonization } from '@aas-core-works/aas-core3.1-typescript';
    import { computed, ref, watch, watchEffect } from 'vue';
    import { detectImportFileKind } from '@/composables/AAS/SerializationFormats';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { Endpoint, ProtocolInformation, SubmodelDescriptor } from '@/types/Descriptors';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import { useAASXImport } from '../../composables/AAS/AASXImport';

    // Stores
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    // Computed Properties
    const aasRepositoryUrl = computed(() => infrastructureStore.getAASRepoURL);
    const smRepositoryUrl = computed(() => infrastructureStore.getSubmodelRepoURL);

    // Composables
    const { fetchAas, uploadAas } = useAASRepositoryClient();
    const { fetchSm } = useSMHandling();
    const { importAasxFileClient, importEnvironmentFileClient } = useAASXImport();
    const { postAasDescriptor, putAasDescriptor, createDescriptorFromAAS } = useAASRegistryClient();
    const { postSubmodelDescriptor, putSubmodelDescriptor, createDescriptorFromSubmodel } = useSMRegistryClient();

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const uploadAASDialog = ref(false);
    const aasFiles = ref<File[]>([]);
    const loadingUpload = ref(false);
    const ignoreDuplicates = ref(true);
    const createDescriptors = ref(false);
    const uploadProgress = ref(0);
    const currentFileLabel = ref('');
    const uploadMode = ref<'client' | 'server'>('client');

    const uploadModes = [
        { title: 'Client-side Import', value: 'client' },
        { title: 'Server Upload Endpoint', value: 'server' },
    ];

    const descriptorsAvailable = computed(() => {
        const components = infrastructureStore.getBasyxComponents as Record<string, { connected?: unknown }>;
        const isConnected = (connected: unknown): boolean => {
            if (connected === true) return true;
            if (!connected || typeof connected !== 'object') return false;

            const maybeRef = connected as { value?: unknown };
            return maybeRef.value === true;
        };

        const aasRegistryConnected = isConnected(components?.AASRegistry?.connected);
        const submodelRegistryConnected = isConnected(components?.SubmodelRegistry?.connected);
        return aasRegistryConnected && submodelRegistryConnected;
    });

    watch(
        () => props.modelValue,
        (value) => {
            uploadAASDialog.value = value;
        }
    );

    watch(
        () => uploadAASDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function uploadAASFiles(): Promise<void> {
        if (aasFiles.value.length === 0) return;

        loadingUpload.value = true;
        uploadProgress.value = 0;

        const summary = {
            total: aasFiles.value.length,
            succeeded: 0,
            warnings: [] as string[],
            failed: [] as string[],
        };

        try {
            if (createDescriptors.value && !descriptorsAvailable.value) {
                summary.warnings.push('Descriptor creation skipped because registries are not connected.');
            }

            for (let index = 0; index < aasFiles.value.length; index++) {
                const aasFile = aasFiles.value[index];
                currentFileLabel.value = aasFile.name;

                if (uploadMode.value === 'server') {
                    const response = await uploadAas(aasFile, ignoreDuplicates.value);

                    if (!response?.success) {
                        summary.failed.push(`${aasFile.name}: upload failed.`);
                    } else {
                        summary.succeeded++;
                        if (createDescriptors.value && descriptorsAvailable.value) {
                            const createdWarnings = await createAndPostDescriptorsFromAasIds(
                                Array.isArray(response?.data?.aasIds) ? response.data.aasIds : []
                            );
                            summary.warnings.push(...createdWarnings.map((warning) => `${aasFile.name}: ${warning}`));
                        }
                    }
                } else {
                    try {
                        const fileKind = detectImportFileKind(aasFile.name);
                        if (fileKind === 'unknown') {
                            summary.failed.push(`${aasFile.name}: unsupported file type.`);
                            continue;
                        }

                        const result =
                            fileKind === 'aasx'
                                ? await importAasxFileClient(aasFile)
                                : await importEnvironmentFileClient(aasFile);

                        if (result.importedAasIds.length === 0) {
                            summary.failed.push(`${aasFile.name}: no AAS imported.`);
                        } else {
                            summary.succeeded++;
                        }

                        summary.warnings.push(
                            ...result.warnings.map((warning: string) => `${aasFile.name}: ${warning}`)
                        );

                        if (createDescriptors.value && descriptorsAvailable.value) {
                            const descriptorWarnings = await createAndPostDescriptorsFromPayload(
                                result.importedAas,
                                result.importedSubmodels
                            );
                            summary.warnings.push(
                                ...descriptorWarnings.map((warning: string) => `${aasFile.name}: ${warning}`)
                            );
                        }
                    } catch (error) {
                        summary.failed.push(`${aasFile.name}: ${stringifyUnknown(error)}`);
                    }
                }

                uploadProgress.value = ((index + 1) / aasFiles.value.length) * 100;
            }

            if (summary.succeeded > 0) {
                navigationStore.dispatchTriggerAASListReload();
            }

            const warningPreview = summary.warnings.slice(0, 3).join(' | ');
            const failurePreview = summary.failed.slice(0, 3).join(' | ');

            if (summary.failed.length === 0) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: summary.warnings.length > 0 ? 'warning' : 'success',
                    btnColor: 'buttonText',
                    text:
                        summary.warnings.length > 0
                            ? `Uploaded ${summary.succeeded}/${summary.total} file(s) with ${summary.warnings.length} warning(s): ${warningPreview}`
                            : `Uploaded ${summary.succeeded}/${summary.total} file(s) successfully.`,
                });
            } else {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: `Uploaded ${summary.succeeded}/${summary.total} file(s). ${summary.failed.length} failed: ${failurePreview}`,
                    extendedError: summary.warnings.length > 0 ? `Warnings: ${warningPreview}` : undefined,
                });
            }
        } catch (error) {
            console.error('Error uploading AAS:', error);
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 6000,
                color: 'error',
                btnColor: 'buttonText',
                text: `AAS upload failed: ${stringifyUnknown(error)}`,
            });
        } finally {
            resetUploadState();
        }
    }

    watchEffect(() => {
        if (!uploadAASDialog.value) {
            resetUploadState();
        }
    });

    function resetUploadState(): void {
        aasFiles.value = [];
        uploadAASDialog.value = false;
        loadingUpload.value = false;
        createDescriptors.value = false;
        uploadProgress.value = 0;
        currentFileLabel.value = '';
        uploadMode.value = 'client';
    }

    function createEndpoints(href: string, type: string): Array<Endpoint> {
        const protocolInformation = new ProtocolInformation(href, null, 'http');
        return [new Endpoint(type, protocolInformation)];
    }

    function stringifyUnknown(value: unknown): string {
        if (value instanceof Error) return value.message;
        if (typeof value === 'string') return value;
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    function asString(value: unknown): string {
        return typeof value === 'string' ? value : '';
    }

    async function createAndPostDescriptorsFromAasIds(aasIds: string[]): Promise<string[]> {
        const warnings: string[] = [];

        for (const aasId of aasIds) {
            try {
                const href = aasRepositoryUrl.value + '/' + base64Encode(aasId);
                const fetchedShell = await fetchAas(href);

                if (!fetchedShell || !fetchedShell.id) {
                    warnings.push(`Skipping descriptor creation, AAS '${aasId}' could not be fetched.`);
                    continue;
                }

                const aasEndpoints = createEndpoints(href, 'AAS-3.0');
                const aasDescriptor = createDescriptorFromAAS(fetchedShell, aasEndpoints);

                const submodelRefs = Array.isArray(fetchedShell.submodels) ? fetchedShell.submodels : [];
                for (const submodelRef of submodelRefs) {
                    const submodelId = submodelRef?.keys?.[0]?.value;
                    if (!submodelId) continue;

                    const submodelDescriptor = await createSubmodelDescriptor(submodelId);
                    const smSuccess =
                        (await postSubmodelDescriptor(submodelDescriptor)) ||
                        (await putSubmodelDescriptor(submodelDescriptor));
                    if (!smSuccess) {
                        warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`);
                    }
                }

                const aasSuccess = (await postAasDescriptor(aasDescriptor)) || (await putAasDescriptor(aasDescriptor));
                if (!aasSuccess) {
                    warnings.push(`Failed to create AAS Descriptor '${aasId}'.`);
                }
            } catch (error) {
                warnings.push(`Error while creating descriptors for AAS '${aasId}': ${stringifyUnknown(error)}`);
            }
        }

        return warnings;
    }

    async function createAndPostDescriptorsFromPayload(
        aasList: Array<Record<string, unknown>>,
        submodels: Array<Record<string, unknown>>
    ): Promise<string[]> {
        const warnings: string[] = [];
        const submodelById = new Map<string, Record<string, unknown>>();

        for (const submodel of submodels) {
            const submodelId = asString(submodel.id).trim();
            if (submodelId !== '') submodelById.set(submodelId, submodel);
        }

        for (const aas of aasList) {
            try {
                const aasId = asString(aas.id).trim();
                if (aasId === '') continue;

                const aasHref = aasRepositoryUrl.value + '/' + base64Encode(aasId);
                const aasDescriptor = createDescriptorFromAAS(
                    aas as unknown as jsonization.JsonObject,
                    createEndpoints(aasHref, 'AAS-3.0')
                );

                const submodelRefs = Array.isArray(aas.submodels) ? aas.submodels : [];
                for (const submodelRef of submodelRefs) {
                    const submodelId = submodelRef?.keys?.[0]?.value;
                    if (!submodelId) continue;

                    const submodel = submodelById.get(submodelId);
                    if (!submodel) {
                        warnings.push(`Submodel '${submodelId}' not found for descriptor creation.`);
                        continue;
                    }

                    const submodelHref = smRepositoryUrl.value + '/' + base64Encode(submodelId);
                    const submodelDescriptor = createDescriptorFromSubmodel(
                        submodel as unknown as jsonization.JsonObject,
                        createEndpoints(submodelHref, 'SUBMODEL-3.0')
                    );
                    const smSuccess =
                        (await postSubmodelDescriptor(submodelDescriptor)) ||
                        (await putSubmodelDescriptor(submodelDescriptor));
                    if (!smSuccess) {
                        warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`);
                    }
                }

                const aasSuccess = (await postAasDescriptor(aasDescriptor)) || (await putAasDescriptor(aasDescriptor));
                if (!aasSuccess) {
                    warnings.push(`Failed to create AAS Descriptor '${aasId}'.`);
                }
            } catch (error) {
                warnings.push(`Error while creating descriptors from imported payload: ${stringifyUnknown(error)}`);
            }
        }

        return warnings;
    }

    async function createSubmodelDescriptor(submodelId: string): Promise<SubmodelDescriptor> {
        try {
            let submodelId64 = base64Encode(submodelId);
            let href = smRepositoryUrl.value + '/' + submodelId64;
            let submodel = await fetchSm(href);

            const endpoints = createEndpoints(href, 'SUBMODEL-3.0');

            return createDescriptorFromSubmodel(submodel, endpoints);
        } catch (error) {
            console.error('Error creating submodel descriptor:', error);
            throw error;
        }
    }
</script>
