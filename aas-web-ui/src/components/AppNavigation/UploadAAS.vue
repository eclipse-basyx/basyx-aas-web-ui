<template>
    <v-dialog v-model="uploadAASDialog" width="600">
        <v-card :loading="loadingUpload">
            <v-card-title>
                <span class="text-subtile-1">Upload AAS to Environment</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <!-- AAS File Input -->
                <v-file-input
                    v-model="aasFile"
                    variant="outlined"
                    density="compact"
                    :multiple="false"
                    clearable
                    class="my-1 mt-3"
                    label="AAS File Upload"
                    :accept="['.aasx', '.xml', '.json']">
                    <template #append-inner>
                        <v-btn
                            size="small"
                            variant="elevated"
                            color="primary"
                            class="text-buttonText"
                            style="right: -4px"
                            @click.stop="uploadAASFile()"
                            >Upload</v-btn
                        >
                    </template>
                </v-file-input>
                <v-checkbox
                    v-model="registerAAS"
                    label="Register AAS"
                ></v-checkbox>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { AASDescriptor, AdministrativeInformation, Endpoint, ProtocolInformation, SubmodelDescriptor } from '@/types/Descriptors';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    const { fetchAas, uploadAas } = useAASRepositoryClient();
    const { fetchSmById } = useSMRepositoryClient();
    const navigationStore = useNavigationStore();
    const aasRepositoryUrl = computed(() => navigationStore.getAASRepoURL);
    const smRepositoryUrl = computed(() => navigationStore.getSubmodelRepoURL);
    const { postAasDescriptor } = useAASRegistryClient();
    const { postSMDescriptor } = useSMRegistryClient();

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const uploadAASDialog = ref(false);
    const aasFile = ref(null as File | null);
    const loadingUpload = ref(false);
    const registerAAS = ref(false);

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

    async function uploadAASFile() {
        if (!aasFile.value) return;
        loadingUpload.value = true;

        let response = await uploadAas(aasFile.value);

        if (registerAAS.value) {
          for (const aasId of response.data.aasIds) {
            createAndPostDescriptors(aasId);
          }
        }

        aasFile.value = null;
        uploadAASDialog.value = false;
        loadingUpload.value = false;
        registerAAS.value = false;
    }

    watchEffect(() => {
      if (uploadAASDialog.value) {
        aasFile.value = null;
        registerAAS.value = false;
      }
    });

    async function createAndPostDescriptors(aasId: string) {
      const href = aasRepositoryUrl.value + "/" + btoa(aasId);
      let data = await fetchAas(href);

      const id = data.id;
      const assetKind = data.assetInformation.assetKind;
      const globalAssetId = data.assetInformation.globalAssetId;

      /*const description = data.description.map((desc: any) => ({
        language: desc.language,
        text: desc.text
      }));*/

      const displayName = data.displayName;

      const submodelInfos = data.submodels.map((submodel: any) => ({
          type: submodel.type,
          keys: submodel.keys.map((key: any) => ({
              type: key.type,
              value: key.value
          }))
      }));

      for (const submodelInfo of submodelInfos) {
        let submodelDescriptor = await createSubmodelDescriptior(submodelInfo.keys[0].value);
        postSMDescriptor(submodelDescriptor);
      }

      const protocolInformation = new ProtocolInformation(
          href,
          null,              // securityAttributes
          "http",            // endpointProtocol
          null,              // endpointProtocolVersion
          null,              // subprotocol
          null,              // subprotocolBody
          null,              // subprotocolBodyEncoding
      );
      const endpoint = new Endpoint("AAS-3.0", protocolInformation);
      const endpoints: Array<Endpoint> = [endpoint];

      const aasDescriptor = new AASDescriptor(
          endpoints,
          id,
          undefined, // administration
          assetKind,
          undefined, // assetType
          undefined, // description,
          displayName,
          undefined, // extensions
          globalAssetId,
          undefined, // idShort
          undefined, // specificAssetId
          undefined, // submodelDescriptors
      );

      await postAasDescriptor(aasDescriptor);
    }

    async function createSubmodelDescriptior(submodelId: string)
    {
      let submodelId64 = btoa(submodelId);
      let submodel = await fetchSmById(submodelId64);
      let href = smRepositoryUrl.value + "/" + submodelId64;

      const protocolInformation = new ProtocolInformation(
            href,
            null,
            "http",
            null,
            null,
            null,
            null,
        );

        const endpoint = new Endpoint("SUBMODEL-3.0", protocolInformation);
        const endpoints: Array<Endpoint> = [endpoint];

        // Create the SubmodelDescriptor instance
        const submodelDescriptor = new SubmodelDescriptor(
            endpoints,
            submodelId,
            null,                 // administration (optional)
            submodel.description ? submodel.description[0].text : null,
            null,                 // displayName (optional)
            null,                 // extensions (optional)
            submodel.idShort,
            submodel.semanticId,
            null                  // supplementalSemanticIds (optional)
        );

        return submodelDescriptor;
    }
</script>
