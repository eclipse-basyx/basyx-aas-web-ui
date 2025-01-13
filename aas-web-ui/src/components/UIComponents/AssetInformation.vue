<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <IdentificationElement
                id="assetInformationIdentification"
                :identification-object="assetInfo"
                :model-type="assetInformation.assetKind"
                :id-type="'Global Asset ID'"
                :name-type="'assetType'"></IdentificationElement>
            <v-divider
                v-if="
                    Array.isArray(assetInformation?.specificAssetIds) && assetInformation?.specificAssetIds.length > 0
                "
                class="mt-2"></v-divider>
            <!-- Specific Asset IDs -->
            <SpecificAssetIds :asset-object="assetInformation"></SpecificAssetIds>
            <v-divider v-if="assetInformation.defaultThumbnail" class="mt-2"></v-divider>
            <v-img
                v-if="assetInformation.defaultThumbnail"
                :src="assetInformation.defaultThumbnail.path"
                max-width="100%"
                :max-height="thumbnailMaxHeight"
                contain
                style="border-radius: 4px"></v-img>
        </v-list>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeMount, onMounted, ref } from 'vue';

    // Props
    const props = defineProps({
        assetInformation: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const thumbnailMaxHeight = ref(0 as number);

    // Computed
    const assetInfo = computed(() => {
        return {
            idShort: props.assetInformation.assetType,
            id: props.assetInformation.globalAssetId,
        };
    });
    const screenHeight = computed(() => {
        return document.documentElement.clientHeight;
    });

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
    });

    onBeforeMount(() => {
        window.removeEventListener('resize', handleResize);
    });

    function handleResize() {
        calcThumbnailMaxHeight();
    }

    function calcThumbnailMaxHeight() {
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
