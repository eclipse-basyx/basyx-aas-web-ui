<template>
    <v-dialog v-model="downloadDialog" max-width="500px">
        <v-card>
            <v-card-title>Configure AASX Package</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <div>You selected the AAS with the ID</div>
                <span class="text-primary font-weight-bold">{{ aas.id }}</span>
                <span> for download.</span><br />
                <v-sheet border rounded class="mt-4">
                    <v-data-table-virtual
                        v-model="selected"
                        density="compact"
                        :headers="headers"
                        :items="submodelIds"
                        style="overflow-y: auto; max-height: 300px"
                        item-value="smId"
                        fixed-header
                        show-select>
                        <template #[`header.smId`]>
                            <div class="font-weight-bold">Submodel</div>
                        </template>
                        <template #[`item.smId`]="{ item }">
                            <div>
                                {{ nameToDisplay(item.submodel) }}
                            </div>
                            <div class="text-medium-emphasis">
                                {{ item.smId }}
                            </div>
                        </template>
                    </v-data-table-virtual>
                </v-sheet>
                <v-checkbox v-model="downloadCDs" label="Also download Concept Descriptions" hide-details></v-checkbox>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="downloadDialog = false">Cancel</v-btn>
                <v-btn variant="tonal" color="primary" :loading="downloadLoading" @click="download">Download</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import { downloadFile } from '@/utils/generalUtils';

    const { getSubmodelRefsById } = useAASRepositoryClient();
    const { fetchSmById } = useSMRepositoryClient();
    const { generateUUIDFromString } = useIDUtils();
    const { nameToDisplay } = useReferableUtils();

    const { getRequest } = useRequestHandling();

    const props = defineProps<{
        modelValue: boolean;
        aas: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const downloadDialog = ref(false);
    const downloadLoading = ref(false);

    const headers = [{ title: 'Submodel', align: 'start', sortable: false, key: 'smId' }] as any;

    const selected = ref<string[]>([]);
    const submodelIds = ref<any[]>([]);
    const downloadEndpoint = ref<string>('');
    const downloadCDs = ref<boolean>(true);

    watch(
        () => props.modelValue,
        async (value) => {
            downloadDialog.value = value;
            selected.value = [];
            submodelIds.value = [];
            downloadEndpoint.value = '';
            downloadCDs.value = true;
            downloadLoading.value = false;
            if (!props.aas) return;
            const submodelRefs = await getSubmodelRefsById(props.aas.id);
            downloadEndpoint.value = props.aas.endpoints[0].protocolInformation.href.split('/shells')[0];
            for (const submodelRef of submodelRefs) {
                const submodel = await fetchSmById(submodelRef.keys[0].value);
                submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
                selected.value.push(submodelRef.keys[0].value);
            }
        }
    );

    watch(
        () => downloadDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function download(): Promise<void> {
        downloadLoading.value = true;
        let aasSerializationPath = downloadEndpoint.value;
        aasSerializationPath +=
            '/serialization?aasIds=' +
            base64Encode(props.aas.id) +
            '&submodelIds=' +
            selected.value.map((submodelId: string) => base64Encode(submodelId)).join('&submodelIds=') +
            '&includeConceptDescriptions=' +
            (downloadCDs.value || true);

        const aasSerializationContext = 'retrieving AAS serialization';
        const disableMessage = false;
        const aasSerializationHeaders = new Headers();
        aasSerializationHeaders.append('Accept', 'application/asset-administration-shell-package+xml');

        const aasSerializationResponse = await getRequest(
            aasSerializationPath,
            aasSerializationContext,
            disableMessage,
            aasSerializationHeaders
        );
        if (aasSerializationResponse.success) {
            const aasSerialization = aasSerializationResponse.data;

            const aasIdShort = props.aas.idShort;

            const filename =
                (aasIdShort && aasIdShort.trim() !== '' ? aasIdShort.trim() : generateUUIDFromString(props.aas.id)) +
                '.aasx';

            downloadFile(filename, aasSerialization);
            downloadLoading.value = false;
        }
    }
</script>
