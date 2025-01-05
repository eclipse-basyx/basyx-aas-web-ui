<template>
    <v-container class="pa-0" fluid>
        <v-sheet>
            <v-divider v-if="!singleAas || !isMobile"></v-divider>
            <v-card-title class="bg-detailsHeader pl-3">
                <v-row align="center" class="pl-4" style="height: 40px">
                    <!-- AAS Status -->
                    <div class="text-caption">{{ 'Status: ' }}</div>
                    <div class="text-caption ml-1" :class="statusColor">
                        {{ status }}
                    </div>
                    <!-- Jump to Submodel List on mobile -->
                    <v-spacer v-if="isMobile"></v-spacer>
                    <v-btn
                        v-if="isMobile"
                        color="primary"
                        density="compact"
                        variant="tonal"
                        border
                        append-icon="mdi-chevron-right"
                        class="text-none"
                        text="Submodels"
                        @click="gotoSubmodelList()" />
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="bg-detailsCard pa-0" style="overflow-y: auto" :style="{ height: detailsListHeight }">
                <!-- Asset Information -->
                <!-- 1) AssetInformation is mandatory for an AssetAdministrationShell -->
                <!-- 2) Minimal (empty) AssetInformation (generated with aas4j) will be { assetKind: null } -->
                <AssetInformation
                    v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
                    :asset-object="assetInformation"></AssetInformation>
                <v-divider
                    v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
                    thickness="2"></v-divider>
                <!-- AAS Details -->
                <v-list v-if="selectedAAS" lines="one" nav class="bg-detailsCard">
                    <!-- AAS Identification -->
                    <IdentificationElement
                        class="mb-2"
                        :identification-object="selectedAAS"
                        :model-type="'AAS'"
                        :id-type="'Identification (ID)'"
                        :name-type="'idShort'"></IdentificationElement>
                    <!-- AAS Administrative Information-->
                    <v-divider v-if="selectedAAS?.administration" class="mt-2"></v-divider>
                    <AdministrativeInformationElement
                        v-if="selectedAAS.administration"
                        :administrative-information-object="selectedAAS.administration"
                        :administrative-information-title="'Administrative Information'"
                        :small="false"
                        :background-color="'detailsCard'"></AdministrativeInformationElement>
                    <v-divider v-if="selectedAAS.displayName && selectedAAS.displayName.length > 0"></v-divider>
                    <!-- AAS DisplayName -->
                    <DisplayNameElement
                        v-if="selectedAAS.displayName && selectedAAS.displayName.length > 0"
                        :display-name-object="selectedAAS.displayName"
                        :display-name-title="'DisplayName'"
                        :small="false"></DisplayNameElement>
                    <v-divider
                        v-if="selectedAAS.description && selectedAAS.description.length > 0"
                        class="mt-2"></v-divider>
                    <!-- AAS Description -->
                    <DescriptionElement
                        v-if="selectedAAS.description && selectedAAS.description.length > 0"
                        :description-object="selectedAAS.description"
                        :description-title="'Description'"
                        :small="false"></DescriptionElement>
                    <v-divider v-if="singleAas && !isMobile" class="mt-2"></v-divider>
                    <!-- Download AAS -->
                    <v-card-actions v-if="singleAas && !isMobile" class="pa-0">
                        <v-spacer></v-spacer>
                        <v-btn size="small" color="primary" variant="tonal" @click="downloadAasx(selectedAAS)">
                            <v-icon left>mdi-download</v-icon>
                            <span>Download AASX</span>
                        </v-btn>
                    </v-card-actions>
                </v-list>
            </v-card-text>
        </v-sheet>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { getRequest } = useRequestHandling();
    const { downloadAasx } = useAASRepositoryClient();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    const props = defineProps({
        status: {
            type: String,
            default: 'check disabled',
        },
    });

    const assetInformation = ref(null as any | null);

    const isMobile = computed(() => navigationStore.getIsMobile);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const singleAas = computed(() => envStore.getSingleAas);
    const detailsListHeight = computed(() => {
        if (isMobile.value) {
            if (singleAas.value) {
                return 'calc(100vh - 40px - 64px - 34px)'; // Full height - footer - header - details header (divider)
            } else {
                return 'calc(100vh - 231px - 40px - 64px - 36px - 64px)'; // Full height - 4x AAS items - footer - header - details header (divider) - Searchbar
            }
        } else {
            if (singleAas.value) {
                return 'calc(100vh - 64px - 64px - 48px - 40px - 35px)'; // Full height - header - title - collapse button - footer - details header (divider)
            } else {
                return 'calc(50vh - 40px - 48px - 33px)'; // Half height - footer - collapse button - details header (divider)
            }
        }
    });
    const statusColor = computed(() => {
        if (props.status === 'online') {
            return 'text-success';
        } else if (props.status === 'check disabled') {
            return 'text-warning';
        } else {
            return 'text-error';
        }
    });

    watch(selectedAAS, () => {
        fetchAssetDetails();
    });

    onMounted(() => {
        fetchAssetDetails();
    });

    function fetchAssetDetails() {
        const aasEndpopint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
        const assetInformationEndpoint = aasEndpopint + '/asset-information';
        const path = assetInformationEndpoint;
        const context = 'retrieving asset information';
        const disableMessage = false;
        getRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                let fetchedAssetInformation = response.data;
                if (
                    fetchedAssetInformation.defaultThumbnail &&
                    fetchedAssetInformation.defaultThumbnail.path &&
                    !fetchedAssetInformation.defaultThumbnail.path.startsWith('http')
                ) {
                    // TODO: This does not work with active keycloak because there the thumbnail would have to be fetched with a token
                    let assetInformationThumbnailEndpoint = assetInformationEndpoint + '/thumbnail';
                    fetchedAssetInformation.defaultThumbnail.path = assetInformationThumbnailEndpoint;
                }
                assetInformation.value = fetchedAssetInformation;
            }
        });
    }

    function gotoSubmodelList() {
        router.push({
            path: '/submodellist',
            query: { aas: route.query.aas },
        });
    }
</script>
