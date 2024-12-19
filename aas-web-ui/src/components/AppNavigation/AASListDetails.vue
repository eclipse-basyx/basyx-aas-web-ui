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
                </v-list>
            </v-card-text>
        </v-sheet>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import AdministrativeInformationElement from '@/components/UIComponents/AdministrativeInformationElement.vue';
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
            AdministrativeInformationElement,
            DisplayNameElement,
            DescriptionElement,
            AssetInformation,
        },
        mixins: [RequestHandling, SubmodelElementHandling],

        props: {
            status: {
                type: String,
                default: 'online',
            },
        },

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

            singleAas() {
                return this.envStore.getSingleAas;
            },

            detailsListHeight() {
                if (this.isMobile) {
                    if (this.singleAas) {
                        return 'calc(100vh - 40px - 64px - 34px)'; // Full height - footer - header - details header (divider)
                    } else {
                        return 'calc(100vh - 231px - 40px - 64px - 36px - 64px)'; // Full height - 4x AAS items - footer - header - details header (divider) - Searchbar
                    }
                } else {
                    if (this.singleAas) {
                        return 'calc(100vh - 64px - 64px - 48px - 40px - 35px)'; // Full height - header - title - collapse button - footer - details header (divider)
                    } else {
                        return 'calc(50vh - 40px - 48px - 33px)'; // Half height - footer - collapse button - details header (divider)
                    }
                }
            },

            statusColor() {
                // console.log('status: ', this.status);
                if (this.status === 'online') {
                    return 'text-success';
                } else if (this.status === 'check disabled') {
                    return 'text-warning';
                } else {
                    return 'text-error';
                }
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
                const aasEndpopint = this.extractEndpointHref(this.selectedAAS, 'AAS-3.0');
                const assetInformationEndpoint = aasEndpopint + '/asset-information';
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
                    query: { aas: this.route.query.aas },
                });
            },
        },
    });
</script>
