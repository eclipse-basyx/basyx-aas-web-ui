<template>
    <v-dialog v-model="downloadDialog" :width="800">
        <v-sheet border rounded="lg">
            <v-card-title class="bg-cardHeader">Download AASX File</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <v-alert border="start" variant="tonal">
                    <span>You selected the AAS with the ID </span>
                    <span class="text-primary font-weight-bold">{{ aas?.id }}</span>
                    <span> for download.</span>
                </v-alert>
                <!-- Submodel Selection -->
                <v-label class="mt-5">Submodel Selection</v-label>
                <SubmodelSelection
                    :selected="selected"
                    :submodel-ids="submodelIds"
                    @update:selected="updateSelectedSubmodels" />
                <!-- Download Options -->
                <v-label class="mt-5">Options</v-label>
                <v-radio-group v-model="downloadMode" density="compact" class="mt-4" hide-details>
                    <v-radio
                        v-for="mode in downloadModes"
                        :key="mode.value"
                        :label="mode.title"
                        :value="mode.value"
                        class="ml-2" />
                </v-radio-group>
                <v-checkbox v-model="downloadCDs" label="Include Concept Descriptions" hide-details class="ml-0" />
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" rounded="lg" @click="downloadDialog = false" />
                <v-btn
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    class="text-buttonText"
                    text="Download"
                    :loading="downloadLoading"
                    @click="download" />
            </v-card-actions>
        </v-sheet>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useAASXPackaging } from '@/composables/AAS/AASXPackaging';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil';
    import { downloadFile } from '@/utils/generalUtils';

    type DownloadAASDescriptor = {
        id?: string;
        idShort?: string;
    };

    type SubmodelSelectionItem = {
        smId: string;
        smIdShort: string;
        submodel: Record<string, unknown>;
    };

    const navigationStore = useNavigationStore();

    const { fetchSmById } = useSMHandling();
    const { createClientAASX, downloadViaBackendSerialization } = useAASXPackaging();
    const { generateUUIDFromString } = useIDUtils();
    const { getSubmodelRefsById } = useAASHandling();

    const props = defineProps<{
        modelValue: boolean;
        aas: DownloadAASDescriptor | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const downloadDialog = ref(false);
    const downloadLoading = ref(false);

    const selected = ref<string[]>([]);
    const submodelIds = ref<SubmodelSelectionItem[]>([]);
    const downloadMode = ref<'client' | 'backend'>('client');
    const downloadModes = [
        { title: 'Client Packaging', value: 'client' },
        { title: 'Backend Serialization', value: 'backend' },
    ];
    const downloadCDs = ref<boolean>(true);

    watch(
        () => props.modelValue,
        async (value) => {
            downloadDialog.value = value;
            selected.value = [];
            submodelIds.value = [];
            downloadMode.value = 'client';
            downloadCDs.value = true;
            downloadLoading.value = false;

            if (!props.aas?.id) return;

            const submodelRefs = await getSubmodelRefsById(props.aas.id);

            for (const submodelRef of submodelRefs) {
                const submodelId = extractIdFromReference(submodelRef, 'Submodel');
                if (!submodelId) continue;

                // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
                const submodel = await fetchSmById(submodelId);
                const smIdShort = typeof submodel?.idShort === 'string' ? submodel.idShort : submodelId;
                submodelIds.value.push({ smId: submodelId, smIdShort, submodel });
                selected.value.push(submodelId);
            }
        }
    );

    watch(
        () => downloadDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    function updateSelectedSubmodels(value: string[]): void {
        selected.value = value;
    }

    async function download(): Promise<void> {
        if (!props.aas?.id) return;

        downloadLoading.value = true;
        try {
            let aasxPackage: Blob;
            let warnings: string[] = [];

            if (downloadMode.value === 'client') {
                const clientAASXResult = await createClientAASX({
                    aasId: props.aas.id,
                    selectedSubmodelIds: selected.value,
                    includeConceptDescriptions: downloadCDs.value,
                });
                aasxPackage = clientAASXResult.blob;
                warnings = clientAASXResult.warnings;
            } else {
                aasxPackage = await downloadViaBackendSerialization(props.aas.id, selected.value, downloadCDs.value);
            }

            const aasIdShort = props.aas.idShort;
            const filename =
                (aasIdShort && aasIdShort.trim() !== '' ? aasIdShort.trim() : generateUUIDFromString(props.aas.id)) +
                '.aasx';

            downloadFile(filename, aasxPackage);

            if (warnings.length > 0) {
                const warningPreview = warnings.slice(0, 3).join(' | ');
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    text: `AASX downloaded with ${warnings.length} warning(s): ${warningPreview}`,
                });
            }

            downloadDialog.value = false;
        } catch (error) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 6000,
                color: 'error',
                btnColor: 'buttonText',
                text: `AASX download failed: ${error}`,
            });
        } finally {
            downloadLoading.value = false;
        }
    }
</script>
