<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <IdentificationElement
                class="mb-2"
                :identification-object="assetInfo"
                :model-type="assetObject.assetKind"
                :id-type="'Global Asset ID'"
                :name-type="'assetType'"></IdentificationElement>
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
    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';

    export default defineComponent({
        name: 'AssetInformation',
        components: {
            IdentificationElement,
        },
        props: ['assetObject'],

        data() {
            return {
                thumbnailMaxHeight: 0,
            };
        },

        computed: {
            assetInfo() {
                let assetInfo = {
                    idShort: this.assetObject.assetType,
                    id: this.assetObject.globalAssetId,
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
                this.thumbnailMaxHeight = 0.3 * this.screenHeight;
            },
        },
    });
</script>
