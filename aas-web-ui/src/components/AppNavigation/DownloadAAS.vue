<template>
    <v-dialog v-model="downloadDialog" max-width="500px">
        <v-card>
            <v-card-title>Configure AASX Package</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <div>You selected the AAS with the ID</div>
                <span class="text-primary font-weight-bold">{{ aas.id }}</span>
                <span> for download.</span><br />
                <SubmodelSelection
                    :selected="selected"
                    :submodel-ids="submodelIds"
                    @update:selected="updateSelectedSubmodels" />
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
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import { downloadFile } from '@/utils/generalUtils';

    const navigationStore = useNavigationStore();

    const { fetchSmById } = useSMHandling();
    const { generateUUIDFromString } = useIDUtils();
    const { getAasEndpointById, getSubmodelRefsById } = useAASHandling();

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

            const aasEndpoint = await getAasEndpointById(props.aas.id);
            if (!aasEndpoint || aasEndpoint.trim() === '') {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Failed to retrieve AAS endpoint.',
                });
                return;
            }
            downloadEndpoint.value = aasEndpoint.split('/shells')[0];

            for (const submodelRef of submodelRefs) {
                // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
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

    function updateSelectedSubmodels(value: string[]): void {
        selected.value = value;
    }

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
            downloadDialog.value = false;
        }
    }
</script>
