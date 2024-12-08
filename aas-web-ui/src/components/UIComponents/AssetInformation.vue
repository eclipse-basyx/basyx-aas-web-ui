<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <IdentificationElement
                id="assetInformationIdentification"
                :identification-object="assetInfo"
                :model-type="assetObject.assetKind"
                :id-type="'Global Asset ID'"
                :name-type="'assetType'"></IdentificationElement>
            <v-divider
                v-if="assetObject.specificAssetIds && assetObject.specificAssetIds.length > 0"
                class="mt-2"></v-divider>
            <!-- Specific Asset IDs -->
            <v-list-item v-if="assetObject.specificAssetIds && assetObject.specificAssetIds.length > 0">
                <template #title>
                    <div class="mt-2 mb-2 text-subtitle-2">
                        {{ 'Specific Asset IDs:' }}
                    </div>
                </template>
                <v-list-item-subtitle v-for="(specificAssetId, index) in assetObject.specificAssetIds" :key="index">
                    <div class="px-2">
                        <v-list-item-title>
                            <v-hover v-slot="{ isHovering, props }">
                                <div
                                    v-bind="props"
                                    :class="isHovering ? 'cursor-pointer' : ''"
                                    class="text-caption"
                                    @click="copyToClipboard(specificAssetId.value, specificAssetId.name)">
                                    <span class="text-subtitle-2">{{ specificAssetId.name + ': ' }}</span>
                                    <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1"
                                        >mdi-clipboard-file-outline</v-icon
                                    >
                                    <span>{{ specificAssetId.value }}</span>
                                </div>
                            </v-hover>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            <SemanticID
                                v-if="
                                    specificAssetId.semanticId &&
                                    specificAssetId.semanticId.keys &&
                                    specificAssetId.semanticId.keys.length > 0
                                "
                                :semantic-id-object="specificAssetId.semanticId"
                                :semantic-title="
                                    specificAssetId.semanticId.keys.length > 0 ? 'Semantic IDs' : 'Semantic ID:'
                                "
                                :small="true"
                                class="mt-n3"></SemanticID>
                        </v-list-item-subtitle>
                    </div>
                    <v-divider v-if="index < assetObject.specificAssetIds.length - 1" class="my-2"></v-divider>
                </v-list-item-subtitle>
            </v-list-item>
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
    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import SemanticID from '@/components/UIComponents/SemanticID.vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'AssetInformation',
        components: {
            IdentificationElement,
            SemanticID,
        },
        props: ['assetObject'],

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

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

            // Function to copy the id to the clipboard
            copyToClipboard(value: string, name: string) {
                if (!value || !value) return;
                // console.log('Copy ID to Clipboard: ', this.identificationObject.id);
                // copy the path to the clipboard

                navigator.clipboard.writeText(value);
                // open Snackbar to inform the user that the path was copied to the clipboard
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 2000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: (name ? name : value) + ' copied to Clipboard.',
                });
            },
        },
    });
</script>
