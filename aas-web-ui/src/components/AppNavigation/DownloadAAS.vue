<template>
    <v-dialog v-model="downloadDialog" max-width="500px">
        <v-card>
            <v-card-title>Configure AASX Package</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <div>You selected the AAS with the ID</div>
                <span class="text-primary font-weight-bold">{{ aas.id }}</span>
                <span> for download.</span><br></br>
                <div class="mt-4">It will be downloaded from</div>
                <span class="text-primary font-weight-bold">{{ downloadEndpoint }}</span>
                <v-data-table class="mt-4" :headers="headers" :items="submodelIds" item-value="smId" show-select v-model="selected"></v-data-table>
                <v-checkbox v-model="downloadCDs" label="Also download Concept Descriptions" hide-details></v-checkbox>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="downloadDialog = false">Cancel</v-btn>
                <v-btn variant="tonal" color="primary" :loading="deleteLoading" @click="download">Download</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { downloadFile } from '@/utils/generalUtils';
    import { useIDUtils } from '@/composables/IDUtils';

    const { getSubmodelRefsById } = useAASRepositoryClient();
    const { generateUUIDFromString } = useIDUtils();

    const { getRequest } = useRequestHandling();

    const props = defineProps<{
        modelValue: boolean;
        aas: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const downloadDialog = ref(false);
    const deleteLoading = ref(false);

    const headers = [
        { title: 'Submodel ID', align: 'start', sortable: false, key: 'smId' },
    ]

    const selected = ref<string[]>([]);
    const submodelIds = ref<any[]>([]);
    const downloadEndpoint = ref<string>("");
    const downloadCDs = ref<boolean>(true);

    watch(
        () => props.modelValue,
        async (value) => {
            downloadDialog.value = value;
            selected.value = [];
            submodelIds.value = [];
            downloadEndpoint.value = "";
            downloadCDs.value = true;
            if(!props.aas) return;
            const submodelRefs = await getSubmodelRefsById(props.aas.id);
            downloadEndpoint.value = props.aas.endpoints[0].protocolInformation.href.split("/shells")[0];
            console.log(props.aas)
            for(const submodelRef of submodelRefs){
                submodelIds.value.push({smId: submodelRef.keys[0].value});
                selected.value.push(submodelRef.keys[0].value)
            }
        }
    );

    watch(
        () => downloadDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function download(){
        let aasSerializationPath = downloadEndpoint.value;
        aasSerializationPath +=
                '/serialization?aasIds=' +
                base64Encode(props.aas.id) +
                '&submodelIds=' +
                selected.value.map((submodelId: string) => base64Encode(submodelId)).join('&submodelIds=') +
                '&includeConceptDescriptions='+(downloadCDs.value || true);
        console.log(aasSerializationPath);

        
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
            }
    }

</script>