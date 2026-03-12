<template>
    <v-container class="pa-3 pa-md-4">
        <div class="mx-auto" style="max-width: 1280px">
            <v-card class="pa-4 mb-4" rounded="lg" border>
                <v-card-title class="text-h5">Digital Product Passport</v-card-title>
                <v-card-text>
                    <v-row class="ma-0" align="center" justify="space-between">
                        <v-col cols="12" md="3" class="pa-2">
                            <v-sheet
                                class="pa-0 d-flex justify-center align-center bg-transparent"
                                :min-height="productImageSrc ? undefined : 140">
                                <v-img
                                    v-if="productImageSrc"
                                    :src="productImageSrc"
                                    :aspect-ratio="productImageAspectRatio"
                                    class="w-100 mx-auto border rounded-lg"
                                    style="max-width: 300px"
                                    contain
                                    @error="onProductImageError" />
                                <v-sheet
                                    v-else
                                    class="w-100 mx-auto border rounded-lg d-flex justify-center align-center"
                                    style="max-width: 300px"
                                    min-height="140">
                                    <v-icon size="48" color="medium-emphasis">mdi-image-off-outline</v-icon>
                                </v-sheet>
                            </v-sheet>
                        </v-col>
                        <v-col cols="12" md="6" class="pa-2">
                            <div class="text-subtitle-1 font-weight-medium mb-2">{{ selectedAasTitle }}</div>
                            <div class="text-caption text-medium-emphasis">DPP ID</div>
                            <div class="text-body-2 text-break">{{ dppIdToDisplay }}</div>
                        </v-col>
                        <v-col cols="12" md="3" class="pa-2 d-flex justify-center justify-md-end">
                            <v-sheet border rounded="lg" class="pa-2" min-width="132">
                                <v-img v-if="qrCodeSrc" :src="qrCodeSrc" width="116" height="116" contain />
                                <v-icon v-else size="36" class="ma-8" color="medium-emphasis">mdi-qrcode-off</v-icon>
                            </v-sheet>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pt-0">
                    <v-tabs
                        :model-value="activeView"
                        color="primary"
                        grow
                        density="comfortable"
                        @update:model-value="onTabChange">
                        <v-tab value="general">General</v-tab>
                        <v-tab value="pcf">Carbon Footprint</v-tab>
                    </v-tabs>
                </v-card-actions>
            </v-card>

            <General v-if="showDefaultGeneral" />
            <router-view />
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import QRCode from 'qrcode';
    import { computed, onMounted, ref, watch } from 'vue';
    import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';
    import { useTechnicalData_v1_2Utils } from '@/composables/AAS/SubmodelTemplates/TechnicalData_v1_2Utils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { urlRegex, useUrlUtils } from '@/composables/UrlUtils';
    import General from '@/pages/modules/DPPDemo/General.vue';
    import { useAASStore } from '@/store/AASDataStore';

    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'DPP Demo',
        isDesktopModule: true,
        isMobileModule: true,
        preserveRouteQuery: true,
    });

    const route = useRoute();
    const router = useRouter();
    const aasStore = useAASStore();
    const { getProductImageUrlByAasId } = useTechnicalData_v1_2Utils();
    const { getAasEndpointById } = useAASRepositoryClient();
    const { getBlobUrl } = useUrlUtils();

    const qrCodeSrc = ref('');
    const productImageSrc = ref('');
    const productImageAspectRatio = ref(1);

    const selectedAas = computed(() => aasStore.getSelectedAAS);
    const selectedAasTitle = computed(() => {
        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) return 'No AAS selected';
        return selectedAas.value?.idShort && selectedAas.value.idShort.trim() !== ''
            ? selectedAas.value.idShort
            : selectedAas.value.id;
    });
    const dppId = computed(() => {
        const selectedAasGlobalAssetId = selectedAas.value?.assetInformation?.globalAssetId;
        const globalAssetIdFromQuery = route.query.globalAssetId || route.query.globalassetid;

        if (selectedAasGlobalAssetId && String(selectedAasGlobalAssetId).trim() !== '') {
            return String(selectedAasGlobalAssetId);
        }

        if (globalAssetIdFromQuery && String(globalAssetIdFromQuery).trim() !== '') {
            return String(globalAssetIdFromQuery);
        }

        return '';
    });
    const dppIdToDisplay = computed(() => (dppId.value && dppId.value.trim() !== '' ? dppId.value : '-'));

    const activeView = computed(() => (route.path.toLowerCase().endsWith('/pcf') ? 'pcf' : 'general'));
    const showDefaultGeneral = computed(() => route.path.toLowerCase() === '/modules/dppdemo');

    watch(
        () => selectedAas.value?.id,
        () => {
            initializeHeaderData();
        }
    );

    onMounted(() => {
        initializeHeaderData();
    });

    async function initializeHeaderData(): Promise<void> {
        productImageSrc.value = '';
        qrCodeSrc.value = '';
        productImageAspectRatio.value = 1;

        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) return;

        if (dppId.value && dppId.value.trim() !== '') {
            try {
                qrCodeSrc.value = await QRCode.toDataURL(dppId.value, {
                    errorCorrectionLevel: 'Q',
                    margin: 2,
                    scale: 4,
                });
            } catch {
                qrCodeSrc.value = '';
            }
        }

        const defaultThumbnail = selectedAas.value?.assetInformation?.defaultThumbnail;

        if (
            defaultThumbnail &&
            Object.keys(defaultThumbnail).length > 0 &&
            defaultThumbnail.path &&
            String(defaultThumbnail.path).trim() !== ''
        ) {
            const { url: thumbnailPath, isExternal: isExternalThumbnail } = resolveDefaultThumbnailRequest(
                defaultThumbnail,
                selectedAas.value.id
            );

            try {
                productImageSrc.value = await getBlobUrl(thumbnailPath, isExternalThumbnail);
                updateProductImageAspectRatio(productImageSrc.value);
            } catch {
                productImageSrc.value = '';
                productImageAspectRatio.value = 1;
            }
            return;
        }

        const imageUrl = await getProductImageUrlByAasId(selectedAas.value.id);

        if (imageUrl && imageUrl.url && imageUrl.url.trim() !== '') {
            try {
                productImageSrc.value = await getBlobUrl(imageUrl.url.trim(), imageUrl.isExternal);
                updateProductImageAspectRatio(productImageSrc.value);
            } catch {
                productImageSrc.value = '';
                productImageAspectRatio.value = 1;
            }
        }
    }

    function onProductImageError(): void {
        productImageSrc.value = '';
        productImageAspectRatio.value = 1;
    }

    function resolveDefaultThumbnailRequest(
        defaultThumbnail: { path: string; isExternal?: boolean | string },
        aasId: string
    ): { url: string; isExternal: boolean } {
        const thumbnailPath = String(defaultThumbnail.path).trim();
        const isExternalThumbnail =
            defaultThumbnail.isExternal === true ||
            String(defaultThumbnail.isExternal).toLowerCase() === 'true' ||
            urlRegex.test(thumbnailPath);

        if (isExternalThumbnail) {
            return { url: thumbnailPath, isExternal: true };
        }

        // A non-external defaultThumbnail path is repository-internal and should be fetched via the thumbnail endpoint.
        const aasEndpoint = getAasEndpointById(aasId);
        if (aasEndpoint && aasEndpoint.trim() !== '') {
            return { url: `${aasEndpoint.trim()}/asset-information/thumbnail`, isExternal: false };
        }

        return { url: thumbnailPath, isExternal: false };
    }

    function updateProductImageAspectRatio(src: string): void {
        if (!src || src.trim() === '') {
            productImageAspectRatio.value = 1;
            return;
        }

        const image = new Image();
        image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                productImageAspectRatio.value = image.naturalWidth / image.naturalHeight;
            }
        };
        image.src = src;
    }

    function onTabChange(tab: string): void {
        if (!tab || tab === activeView.value) return;

        const query = { ...route.query } as LocationQueryRaw;

        if (tab === 'pcf') {
            void navigateTo('/modules/dppdemo/pcf', query);
            return;
        }

        void navigateTo('/modules/dppdemo', query);
    }

    async function navigateTo(path: string, query: LocationQueryRaw): Promise<void> {
        // Using full route objects preserves selected AAS/path query when switching DPP views.
        await router.push({ path, query });
    }
</script>
