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

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent, Ref, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'Entity',
        props: {
            entityObject: {
                type: Object,
                default: () => ({}),
            },
        },

        setup() {
            const aasStore = useAASStore();
            const router = useRouter();

            const { getAasId } = useAASDiscoveryClient();
            const { fetchAasDescriptor } = useAASHandling();
            const { copyToClipboard } = useClipboardUtil();
            const { jumpToAasByAasDescriptor } = useJumpHandling();

            const copyIcon = ref<string>('mdi-clipboard-file-outline');

            const getCopyIconAsRef = (): Ref => {
                return copyIcon;
            };

            return {
                aasStore, // AASStore Object
                router, // Router Object
                copyToClipboard,
                copyIcon,
                getCopyIconAsRef,
                jumpToAasByAasDescriptor,
                getAasId,
                fetchAasDescriptor,
            };
        },

        data() {
            return {
                disabledStates: {} as any,
                loadingStates: {} as any,
                aasDescriptors: {} as any,
            };
        },

        created() {
            // initialize disabledStates, loadingStates and
            if (this.entityObject.globalAssetId) {
                this.checkAndSetDisabledState(this.entityObject.globalAssetId);
                this.loadingStates[this.entityObject.globalAssetId] = false;
            }
            if (this.entityObject.specificAssetIds) {
                this.entityObject.specificAssetIds.forEach((specificAssetId: any) => {
                    this.checkAndSetDisabledState(specificAssetId.name);
                    this.loadingStates[specificAssetId.name] = false;
                });
            }
        },

        methods: {
            isDisabled(assetId: string): boolean {
                if (this.entityObject?.entityType && this.entityObject?.entityType === 'CoManagedEntity') return true;
                return this.disabledStates[assetId] || false;
            },

            isLoading(assetId: string): boolean {
                return this.loadingStates[assetId] || false;
            },

            checkAndSetDisabledState(assetId: string) {
                if (this.entityObject.entityType === 'CoManagedEntity') return;
                this.loadingStates[assetId] = true;
                this.getAasId(assetId)
                    .then(async (aasId: string) => {
                        this.loadingStates[assetId] = false;
                        if (aasId && aasId.trim() !== '') {
                            this.disabledStates[assetId] = false;
                            this.aasDescriptors[assetId] = await this.fetchAasDescriptor(aasId);
                        } else {
                            this.disabledStates[assetId] = true;
                        }
                    })
                    .catch(() => {
                        this.loadingStates[assetId] = false;
                        this.disabledStates[assetId] = true;
                    });
            },

            jump(assetId: string) {
                // console.log('Jump to AAS with assetId: ', assetId);
                let aasDescriptor = this.aasDescriptors[assetId];
                this.jumpToAasByAasDescriptor(aasDescriptor);
            },
        },
    });
</script>
