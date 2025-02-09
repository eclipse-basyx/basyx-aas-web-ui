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
                    assetObject.specificAssetIds &&
                    Array.isArray(assetObject.specificAssetIds) &&
                    assetObject.specificAssetIds.length > 0
                "></v-divider>
            <!-- Specific Asset IDs -->
            <SpecificAssetIds :specific-asset-ids="assetObject.specificAssetIds"></SpecificAssetIds>
            <v-img
                v-if="defaultThumbnailUrl"
                :src="defaultThumbnailUrl"
                max-width="100%"
                :max-height="thumbnailMaxHeight"
                contain
                class="mt-2 rounded"></v-img>
            <span
                v-if="defaultThumbnailCaption !== ''"
                class="font-weight-light text-medium-emphasis"
                style="font-size: 0.5rem">
                {{ defaultThumbnailCaption }}
            </span>
        </v-list>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useTechnicalData_v1_2Utils } from '@/composables/SubmodelTemplates/TechnicalData_v1_2Utils';
    import { useAASStore } from '@/store/AASDataStore';

    // Composables
    const { getProductImageUrlByAasId: getProductImageUrlByAasIdFromSmTechnicalData } = useTechnicalData_v1_2Utils();

    // Props
    const props = defineProps({
        assetObject: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Stores
    const aasStore = useAASStore();

    // Data
    const thumbnailMaxHeight = ref(0 as number);
    const defaultThumbnailUrl = ref('' as string);
    const defaultThumbnailCaption = ref('' as string);

    // Computed
    const assetInfo = computed(() => {
        return {
            idShort: props.assetObject.assetType ? props.assetObject.assetType : 'Asset',
            id: props.assetObject.globalAssetId,
            modelType: 'Asset',
        };
    });
    const selectedAas = computed(() => aasStore.getSelectedAAS);
    const screenHeight = computed(() => {
        return document.documentElement.clientHeight;
    });

    // Watcher
    watch(
        () => props.assetObject,
        () => {
            initialize();
        }
    );
    onMounted(() => {
        window.addEventListener('resize', handleResize);
        initialize();
        handleResize();
    });
    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
    });

    async function initialize(): Promise<void> {
        if (!props.assetObject || Object.keys(props.assetObject).length === 0) {
            defaultThumbnailUrl.value = '';
            defaultThumbnailCaption.value = '';
            return;
        }
        if (
            props.assetObject.defaultThumbnail &&
            Object.keys(props.assetObject.defaultThumbnail).length > 0 &&
            props.assetObject.defaultThumbnail?.path &&
            props.assetObject.defaultThumbnail?.path.trim() !== ''
        ) {
            defaultThumbnailUrl.value = props.assetObject.defaultThumbnail.path.trim();
            defaultThumbnailCaption.value = '';
        } else {
            const productImageUrlFromSmTechnicalData = await getProductImageUrlByAasIdFromSmTechnicalData(
                selectedAas.value.id
            );
            if (productImageUrlFromSmTechnicalData && productImageUrlFromSmTechnicalData.trim() !== '') {
                defaultThumbnailUrl.value = productImageUrlFromSmTechnicalData.trim();
                defaultThumbnailCaption.value = 'Product Image from SM TechnicalData';
            } else {
                defaultThumbnailUrl.value = '';
                defaultThumbnailCaption.value = '';
            }
        }
    }
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
