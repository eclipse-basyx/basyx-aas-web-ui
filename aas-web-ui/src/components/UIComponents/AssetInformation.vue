<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <!-- Asset Identification -->
            <IdentificationElement
                id="assetInformationIdentification"
                :identification-object="assetInfo"
                :v-chip-content="assetInformationObject.assetKind"
                :identification-title="'Global Asset ID'" />
            <!-- AAS further information as expandable panels -->
            <v-expansion-panels v-model="openPanels" multiple class="mb-n0">
                <!-- Specific Asset IDs -->
                <template v-if="hasSpecificAssetIds">
                    <v-divider />
                    <SpecificAssetIdsElement
                        :specific-asset-ids-array="assetInformationObject?.specificAssetIds"
                        :background-color="'detailsCard'" />
                </template>
            </v-expansion-panels>
            <!-- Asset Thumbnail -->
            <template v-if="assetInformationObject.defaultThumbnail">
                <v-divider />
                <v-img
                    :src="assetInformationObject.defaultThumbnail.path"
                    max-width="100%"
                    :max-height="thumbnailMaxHeight"
                    contain
                    class="mt-2 mx-0" />
            </template>
        </v-list>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

    const props = defineProps({
        assetInformationObject: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const thumbnailMaxHeight = ref(0 as number);
    const openPanels = ref<number[]>([]);

    // Computed
    const assetInfo = computed(() => {
        return {
            idShort: props.assetInformationObject.assetType ? props.assetInformationObject.assetType : 'Asset',
            id: props.assetInformationObject.globalAssetId,
            modelType: 'Asset',
        };
    });
    const screenHeight = computed(() => {
        return document.documentElement.clientHeight;
    });
    const hasSpecificAssetIds = computed(() =>
        props.assetInformationObject?.specificAssetIds &&
        Array.isArray(props.assetInformationObject?.specificAssetIds) &&
        props.assetInformationObject?.specificAssetIds.length > 0
            ? true
            : false
    );
    const openPanelNumber = computed(() => null);

    // Watcher
    watch(
        () => props.assetInformationObject,
        async () => {
            openPanels.value = openPanelNumber.value === null ? [] : [openPanelNumber.value];
        },
        { deep: true }
    );

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
    });
    function handleResize(): void {
        calcThumbnailMaxHeight();
    }

    function calcThumbnailMaxHeight(): void {
        const toolbarHeight = document.getElementsByClassName('v-toolbar')[0]?.clientHeight as number;
        const footerHeight = document.getElementsByClassName('v-footer')[0]?.clientHeight as number;
        const closeSidebarHeight = document.getElementById('closeAasList')?.clientHeight as number;
        const titleAasListHeight = document.getElementById('titleAasList')?.clientHeight as number;
        const assetInformationIdentificationHeight = document.getElementById('assetInformationIdentification')
            ?.clientHeight as number;

        const availableHeight = (screenHeight.value -
            (toolbarHeight ? toolbarHeight : 0) -
            (titleAasListHeight ? titleAasListHeight : 0) -
            (assetInformationIdentificationHeight ? assetInformationIdentificationHeight : 0) -
            (closeSidebarHeight ? closeSidebarHeight : 0) -
            (footerHeight ? footerHeight : 0)) as number;

        if (screenHeight.value < 600) {
            // xs display
            thumbnailMaxHeight.value = 1 * availableHeight;
        } else if (screenHeight.value >= 600 && screenHeight.value < 1280) {
            // sm & md display
            thumbnailMaxHeight.value = 0.5 * availableHeight;
        } else if (screenHeight.value >= 1280) {
            // lg & xl & xxl display
            thumbnailMaxHeight.value = 0.4 * availableHeight;
        }
    }
</script>
