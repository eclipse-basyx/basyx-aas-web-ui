<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <IdentificationElement
                id="assetInformationIdentification"
                :identification-object="assetInfo"
                :v-chip-content="assetObject.assetKind"
                :identification-title="'Global Asset ID'"></IdentificationElement>
            <v-divider
                v-if="
                    assetObject?.specificAssetIds &&
                    Array.isArray(assetObject?.specificAssetIds) &&
                    assetObject?.specificAssetIds.length > 0
                "></v-divider>
            <!-- Specific Asset IDs -->
            <SpecificAssetIds :asset-object="assetObject"></SpecificAssetIds>
            <v-divider v-if="assetObject.defaultThumbnail" class="mt-2"></v-divider>
            <v-img
                v-if="assetObject.defaultThumbnail"
                :src="assetObject.defaultThumbnail.path"
                max-width="100%"
                :max-height="thumbnailMaxHeight"
                contain
                style="border-radius: 4px"></v-img>
        </v-list>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'AssetInformation',
        props: ['assetObject'],

        data() {
            return {
                thumbnailMaxHeight: 0,
            };
        },

        computed: {
            assetInfo() {
                let assetInfo = {
                    idShort: this.assetObject?.assetType ? this.assetObject?.assetType : 'Asset',
                    id: this.assetObject.globalAssetId,
                    modelType: 'Asset',
                };
                return assetInfo;
            },

            screenHeight() {
                return document.documentElement.clientHeight;
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
            handleResize() {
                this.calcThumbnailMaxHeight();
            },

            calcThumbnailMaxHeight() {
                const toolbarHeight = document.getElementsByClassName('v-toolbar')[0]?.clientHeight as number;
                const footerHeight = document.getElementsByClassName('v-footer')[0]?.clientHeight as number;
                const closeSidebarHeight = document.getElementById('closeAasList')?.clientHeight as number;
                const titleAasListHeight = document.getElementById('titleAasList')?.clientHeight as number;
                const assetInformationIdentificationHeight = document.getElementById('assetInformationIdentification')
                    ?.clientHeight as number;

                const availableHeight = (this.screenHeight -
                    (toolbarHeight ? toolbarHeight : 0) -
                    (titleAasListHeight ? titleAasListHeight : 0) -
                    (assetInformationIdentificationHeight ? assetInformationIdentificationHeight : 0) -
                    (closeSidebarHeight ? closeSidebarHeight : 0) -
                    (footerHeight ? footerHeight : 0)) as number;

                if (this.screenHeight < 600) {
                    // xs display
                    this.thumbnailMaxHeight = 1 * availableHeight;
                } else if (this.screenHeight >= 600 && this.screenHeight < 1280) {
                    // sm & md display
                    this.thumbnailMaxHeight = 0.5 * availableHeight;
                } else if (this.screenHeight >= 1280) {
                    // lg & xl & xxl display
                    this.thumbnailMaxHeight = 0.4 * availableHeight;
                }
            },
        },
    });
</script>
