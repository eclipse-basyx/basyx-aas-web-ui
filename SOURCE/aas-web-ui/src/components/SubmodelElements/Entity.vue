<template>
    <v-container fluid class="pa-0">
        <!-- entityType -->
        <v-list-item class="px-1 pb-1 pt-2">
            <v-list-item-title>
                <span class="text-subtitle-2 mr-2">{{ 'Entity Type: ' }}</span>
                <v-chip label size="x-small" border color="primary" style="margin-top: -3px">{{
                    entityObject.entityType
                }}</v-chip>
            </v-list-item-title>
        </v-list-item>
        <v-divider v-if="entityObject?.globalAssetId"></v-divider>
        <!-- globalAssetId -->
        <v-hover v-slot="{ isHovering, props }">
            <v-list-item v-if="entityObject?.globalAssetId" class="px-1 pb-1 py-2 mb-3">
                <template #title>
                    <div class="text-subtitle-2 mt-2">{{ 'Global Asset ID: ' }}</div>
                </template>
                <template #append>
                    <v-btn
                        size="small"
                        class="mr-2 text-buttonText"
                        color="primary"
                        :disabled="isDisabled(entityObject.globalAssetId)"
                        :loading="isLoading(entityObject.globalAssetId)"
                        @click="jump(entityObject.globalAssetId)"
                        >Jump</v-btn
                    >
                </template>
                <template #subtitle>
                    <div
                        v-if="entityObject.globalAssetId"
                        v-bind="props"
                        :class="isHovering ? 'cursor-pointer' : ''"
                        @click="copyToClipboard(entityObject.globalAssetId, 'Global Asset ID', getCopyIconAsRef())">
                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                            copyIcon
                        }}</v-icon>
                        <span>{{ entityObject.globalAssetId ? entityObject.globalAssetId : '' }}</span>
                    </div>
                </template>
            </v-list-item>
        </v-hover>
        <v-divider v-if="entityObject.specificAssetIds && entityObject.specificAssetIds.length > 0"></v-divider>
        <!-- specificAssetIds -->
        <v-list-item
            v-if="entityObject.specificAssetIds && entityObject.specificAssetIds.length > 0"
            class="px-1 pb-1 py-2 mb-3">
            <template #title>
                <div class="text-subtitle-2 mt-2">{{ 'Specific Asset IDs: ' }}</div>
            </template>
            <template #subtitle>
                <div v-for="specificAssetId in entityObject.specificAssetIds" :key="specificAssetId.name" class="pt-2">
                    <v-btn
                        size="small"
                        class="mr-2 text-buttonText"
                        color="primary"
                        :disabled="isDisabled(specificAssetId.value)"
                        :loading="isLoading(specificAssetId.value)"
                        @click="jump(specificAssetId.value)"
                        >Jump</v-btn
                    >
                    <v-chip label size="x-small" border color="primary" class="mr-2" style="margin-top: -3px">{{
                        specificAssetId.name
                    }}</v-chip>
                    <span>{{ specificAssetId.value }}</span>
                </div>
            </template>
        </v-list-item>
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :sme-object="entityObject"
            :sme-locator="'statements'"
            :top-margin="'mt-1'"></SubmodelElementGroup>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, Ref, ref, watch } from 'vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useJumpHandling } from '@/composables/JumpHandling';

    const props = defineProps({
        entityObject: {
            type: Object,
            default: () => ({}),
        },
    });

    // Composables
    const { getAasId } = useAASDiscoveryClient();
    const { fetchAasDescriptor } = useAASHandling();
    const { copyToClipboard } = useClipboardUtil();
    const { jumpToAasByAasDescriptor } = useJumpHandling();

    const disabledStates = ref<any>({});
    const loadingStates = ref<any>({});
    const aasDescriptors = ref<any>({});
    const copyIcon = ref<string>('mdi-clipboard-file-outline');
    const getCopyIconAsRef = (): Ref => {
        return copyIcon;
    };

    // Watchers
    watch(
        () => props.entityObject,
        () => {
            if (props.entityObject.globalAssetId) {
                checkAndSetDisabledState(props.entityObject.globalAssetId);
                loadingStates.value[props.entityObject.globalAssetId] = false;
            }
            if (props.entityObject.specificAssetIds) {
                props.entityObject.specificAssetIds.forEach((specificAssetId: any) => {
                    checkAndSetDisabledState(specificAssetId.name);
                    loadingStates.value[specificAssetId.name] = false;
                });
            }
        }
    );

    onMounted(() => {
        // initialize disabledStates, loadingStates and
        if (props.entityObject.globalAssetId) {
            checkAndSetDisabledState(props.entityObject.globalAssetId);
            loadingStates.value[props.entityObject.globalAssetId] = false;
        }
        if (props.entityObject.specificAssetIds) {
            props.entityObject.specificAssetIds.forEach((specificAssetId: any) => {
                checkAndSetDisabledState(specificAssetId.name);
                loadingStates.value[specificAssetId.name] = false;
            });
        }
    });

    function checkAndSetDisabledState(assetId: string): void {
        if (props.entityObject.entityType === 'CoManagedEntity') return;
        loadingStates.value[assetId] = true;
        getAasId(assetId)
            .then(async (aasId: string) => {
                loadingStates.value[assetId] = false;
                if (aasId && aasId.trim() !== '') {
                    disabledStates.value[assetId] = false;
                    aasDescriptors.value[assetId] = await fetchAasDescriptor(aasId);
                } else {
                    disabledStates.value[assetId] = true;
                }
            })
            .catch(() => {
                loadingStates.value[assetId] = false;
                disabledStates.value[assetId] = true;
            });
    }

    function isDisabled(assetId: string): boolean {
        if (props.entityObject?.entityType && props.entityObject?.entityType === 'CoManagedEntity') return true;
        return disabledStates.value[assetId] || false;
    }

    function isLoading(assetId: string): boolean {
        return loadingStates.value[assetId] || false;
    }

    function jump(assetId: string): void {
        // console.log('Jump to AAS with assetId: ', assetId);
        let aasDescriptor = aasDescriptors.value[assetId];
        jumpToAasByAasDescriptor(aasDescriptor);
    }
</script>
