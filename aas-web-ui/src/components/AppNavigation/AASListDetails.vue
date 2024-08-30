<template>
    <v-container class="pa-0" fluid>
        <!-- AAS Details Card (only visible if the Information Button is pressed on an AAS) -->
        <v-expand-transition>
            <div
                v-if="showDetailsCard"
                class="transition-fast-in-fast-out"
                :class="isMobile ? 'v-card--reveal-mobile' : 'v-card--reveal-desktop'"
                style="z-index: 9000">
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
                <!-- AAS Details -->
                <v-list v-if="detailsObject" lines="one" nav class="bg-detailsCard">
                    <!-- AAS Identification -->
                    <IdentificationElement
                        class="mb-2"
                        :identification-object="detailsObject"
                        :model-type="'AAS'"
                        :id-type="'Identification (ID)'"
                        :name-type="'idShort'"></IdentificationElement>
                    <v-divider v-if="detailsObject.description && detailsObject.description.length > 0"></v-divider>
                    <!-- AAS Description -->
                    <DescriptionElement
                        v-if="detailsObject.description && detailsObject.description.length > 0"
                        :description-object="detailsObject.description"
                        :description-title="'Description'"
                        :small="false"></DescriptionElement>
                </v-list>
                <v-divider v-if="assetInformation"></v-divider>
                <!-- Asset Information -->
                <AssetInformation
                    v-if="assetInformation && Object.keys(assetInformation).length > 0"
                    :asset-object="assetInformation"></AssetInformation>
            </div>
        </v-expand-transition>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import AssetInformation from '@/components/UIComponents/AssetInformation.vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';
    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'AASListDetails',
        components: {
            IdentificationElement,
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
            };
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },
        },

        watch: {
            detailsObject() {
                // If the AAS Details Card is opened, request asset-information
                if (this.showDetailsCard) {
                    this.fetchAssetDetails();
                }
            },
        },

        methods: {
            // Function to close the AAS Details Card and emit the event to the parent component
            closeDetails() {
                this.$emit('close-details');
            },

            // Function to fetch the Asset Details from the AAS Repository
            fetchAssetDetails() {
                // console.log('fetch asset details: ', this.detailsObject);
                // strip everything after /shells from detailsobject.endpoints[0].protocolInformation.href
                let aasRepoEndpoint = this.detailsObject.endpoints[0].protocolInformation.href.split('/shells')[0];
                let assetInformationEndpoint =
                    aasRepoEndpoint + '/shells/' + this.URLEncode(this.detailsObject.id) + '/asset-information';
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
        },
    });
</script>

<style>
    .v-card--reveal-mobile {
        bottom: 0px;
        opacity: 0.96;
        position: absolute;
        width: 100%;
    }
    .v-card--reveal-desktop {
        bottom: 48px;
        opacity: 0.96;
        position: absolute;
        width: 100%;
    }
</style>
