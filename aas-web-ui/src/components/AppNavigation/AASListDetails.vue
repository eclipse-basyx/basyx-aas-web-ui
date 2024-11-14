<template>
    <v-container class="pa-0" fluid>
        <!-- AAS Details Card (only visible if the Information Button is pressed on an AAS) -->
        <v-expand-transition>
            <v-card
                v-if="showDetailsCard"
                :height="detailsCardHeight"
                :class="isMobile ? 'v-card--reveal-mobile' : 'v-card--reveal-desktop'">
                <v-divider></v-divider>
                <v-card-title class="bg-detailsHeader pl-3">
                    <v-row align="center" class="pl-4">
                        <!-- AAS Status -->
                        <div class="text-caption">{{ 'Status: ' }}</div>
                        <div
                            class="text-caption ml-1"
                            :class="detailsObject.status == 'online' ? 'text-success' : 'text-error'">
                            {{ detailsObject.status }}
                        </div>
                        <v-spacer></v-spacer>
                        <!-- Close Button -->
                        <v-btn
                            icon="mdi-close-circle-outline"
                            size="small"
                            variant="plain"
                            style="z-index: 2000; margin-right: -8px"
                            @click="closeDetails()"></v-btn>
                    </v-row>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-0">
                    <!-- Asset Information -->
                    <AssetInformation
                        v-if="assetInformation && Object.keys(assetInformation).length > 0"
                        :asset-object="assetInformation"></AssetInformation>
                    <v-divider v-if="assetInformation" style="border-width: 2px"></v-divider>
                    <!-- AAS Details -->
                    <v-list v-if="detailsObject" lines="one" nav class="bg-detailsCard">
                        <!-- AAS Identification -->
                        <IdentificationElement
                            class="mb-2"
                            :identification-object="detailsObject"
                            :model-type="'AAS'"
                            :id-type="'Identification (ID)'"
                            :name-type="'idShort'"></IdentificationElement>
                        <v-divider
                            v-if="detailsObject.displayName && detailsObject.displayName.length > 0"
                            class="mt-2"></v-divider>
                        <!-- SubmodelELement DisplayName -->
                        <DisplayNameElement
                            v-if="detailsObject.displayName && detailsObject.displayName.length > 0"
                            :display-name-object="detailsObject.displayName"
                            :display-name-title="'DisplayName'"
                            :small="false"></DisplayNameElement>
                        <v-divider
                            v-if="detailsObject.description && detailsObject.description.length > 0"
                            class="mt-2"></v-divider>
                        <!-- AAS Description -->
                        <DescriptionElement
                            v-if="detailsObject.description && detailsObject.description.length > 0"
                            :description-object="detailsObject.description"
                            :description-title="'Description'"
                            :small="false"></DescriptionElement>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-expand-transition>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import AssetInformation from '@/components/UIComponents/AssetInformation.vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';
    import DisplayNameElement from '@/components/UIComponents/DisplayNameElement.vue';
    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
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
        props: ['detailsObject', 'showDetailsCard'], // Props from the parent component with the AAS Details Object and the boolean to show the AAS Details Card

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                assetInformation: null as any, // Asset Information Object
                detailsCardHeight: 0,
            };
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            screenHeight() {
                return document.documentElement.clientHeight;
            },
        },

        watch: {
            detailsObject() {
                // If the AAS Details Card is opened, request asset-information
                if (this.showDetailsCard) {
                    this.fetchAssetDetails();
                }
            },

            showDetailsCard() {
                this.calcDetailsCardHeight();
            },
        },

        mounted() {
            window.addEventListener('resize', this.handleResize);
            this.handleResize();
        },

        beforeUnmount() {
            window.removeEventListener('resize', this.handleResize);
        },

        methods: {
            // Function to close the AAS Details Card and emit the event to the parent component
            closeDetails() {
                this.$emit('close-details');
            },

            // Function to fetch the Asset Details from the AAS Repository
            fetchAssetDetails() {
                // console.log('fetch asset details: ', this.detailsObject);
                const shellHref = this.extractEndpointHref(this.detailsObject, 'AAS-3.0');
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

            handleResize() {
                this.calcDetailsCardHeight();
            },

            calcDetailsCardHeight() {
                const toolbarHeight = document.getElementsByClassName('v-toolbar')[0]?.clientHeight as number;
                const footerHeight = document.getElementsByClassName('v-footer')[0]?.clientHeight as number;
                const closeSidebarHeight = document.getElementById('closeAasList')?.clientHeight as number;

                const availableHeight = (this.screenHeight -
                    (toolbarHeight ? toolbarHeight : 0) -
                    (closeSidebarHeight ? closeSidebarHeight : 0) -
                    (footerHeight ? footerHeight : 0)) as number;

                if (this.screenHeight < 600) {
                    // xs display
                    this.detailsCardHeight = 1 * availableHeight;
                } else if (this.screenHeight >= 600 && this.screenHeight < 1280) {
                    // sm & md display
                    this.detailsCardHeight = 0.75 * availableHeight;
                } else if (this.screenHeight >= 1280) {
                    // lg & xl & xxl display
                    this.detailsCardHeight = 0.5 * availableHeight;
                }
            },
        },
    });
</script>

<style lang="css" scoped>
    .v-card--reveal-mobile {
        position: absolute;
        bottom: 0px;
        width: 100%;
        z-index: 9000;
    }
    .v-card--reveal-desktop {
        position: absolute;
        bottom: 48px;
        width: 100%;
        z-index: 9000;
    }
    .v-card-text {
        position: absolute;
        top: 34px;
        bottom: 0px;
        width: 100%;
        overflow-y: auto;
    }
</style>
