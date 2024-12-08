<template>
    <v-container class="pa-0" fluid>
        <v-divider v-if="!singleAasRedirect" style="border-width: 2px"></v-divider>
        <!-- AAS Details Card (only visible if the Information Button is pressed on an AAS) -->
        <v-card-text
            class="bg-detailsCard pa-0"
            :class="isMobile ? 'v-card--reveal-mobile' : 'v-card--reveal-desktop'"
            style="overflow-y: auto"
            :style="{
                height: isMobile
                    ? singleAasRedirect
                        ? ''
                        : 'calc(75vh - 182px)'
                    : singleAasRedirect
                      ? 'calc(100vh - 218px)'
                      : 'calc(67vh - 112px)',
            }">
            <!-- Asset Information -->
            <AssetInformation
                v-if="assetInformation && Object.keys(assetInformation).length > 0"
                :asset-object="assetInformation"></AssetInformation>
            <v-divider v-if="assetInformation"></v-divider>
            <!-- AAS Details -->
            <v-list v-if="selectedAAS" lines="one" nav class="bg-detailsCard">
                <!-- AAS Identification -->
                <IdentificationElement
                    class="mb-2"
                    :identification-object="selectedAAS"
                    :model-type="'AAS'"
                    :id-type="'Identification (ID)'"
                    :name-type="'idShort'"></IdentificationElement>
                <v-divider
                    v-if="selectedAAS.displayName && selectedAAS.displayName.length > 0"
                    class="mt-2"></v-divider>
                <!-- SubmodelELement DisplayName -->
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
                <template v-if="isMobile">
                    <v-divider class="mt-2"></v-divider>
                    <v-list-item>
                        <template #title>
                            <div class="mt-2 text-subtitle-2">
                                {{ 'Submodel List' }}
                                <v-btn
                                    class="ml-2"
                                    variant="plain"
                                    icon="mdi-chevron-right"
                                    @click="gotoSubmodelList()"></v-btn>
                            </div>
                        </template>
                    </v-list-item>
                </template>
            </v-list>
        </v-card-text>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import AssetInformation from '@/components/UIComponents/AssetInformation.vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';
    import DisplayNameElement from '@/components/UIComponents/DisplayNameElement.vue';
    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'AASListDetails',
        components: {
            IdentificationElement,
            DisplayNameElement,
            DescriptionElement,
            AssetInformation,
        },
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const envStore = useEnvStore();
            const route = useRoute();
            const router = useRouter();

            return {
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                envStore, // EnvironmentStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        data() {
            return {
                assetInformation: null as any, // Asset Information Object
            };
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            // get the selected AAS from Store
            selectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            singleAasRedirect() {
                return this.envStore.getSingleAasRedirect;
            },
        },

        watch: {
            selectedAAS() {
                this.fetchAssetDetails();
            },
        },

        mounted() {
            this.fetchAssetDetails();
        },

        methods: {
            // Function to fetch the Asset Details from the AAS Repository
            fetchAssetDetails() {
                // console.log('fetch asset details: ', this.selectedAAS);
                const shellHref = this.extractEndpointHref(this.selectedAAS, 'AAS-3.0');
                const assetInformationEndpoint = shellHref + '/asset-information';
                // console.log('aasRepoEndpoint: ', assetInformationEndpoint);
                let path = assetInformationEndpoint;
                let context = 'retrieving asset information';
                let disableMessage = false;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // console.log('asset information: ', response.data);
                        let assetInformation = response.data;
                        if (
                            assetInformation.defaultThumbnail &&
                            assetInformation.defaultThumbnail.path &&
                            !assetInformation.defaultThumbnail.path.startsWith('http')
                        ) {
                            let assetInformationThumbnailEndpoint = assetInformationEndpoint + '/thumbnail';
                            assetInformation.defaultThumbnail.path = assetInformationThumbnailEndpoint;
                        }
                        // console.log('asset information thumbnail: ', assetInformation.defaultThumbnail);
                        this.assetInformation = assetInformation;
                    }
                });
            },

            gotoSubmodelList() {
                this.router.push({
                    path: '/submodellist',
                    //         query: { aas: shellHref },
                });
            },
        },
    });
</script>

<!-- <style lang="css" scoped>
    .v-card--reveal-mobile {
        bottom: 0px;
        position: absolute;
        width: 100%;
        z-index: 9000;
    }
    .v-card--reveal-desktop {
        bottom: 48px;
        position: absolute;
        width: 100%;
        z-index: 9000;
    }
</style> -->
