<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="specificAssetIds && Array.isArray(specificAssetIds) && specificAssetIds.length > 0">
            <template #title>
                <div class="mt-1 mb-2 text-subtitle-2">
                    {{ 'Specific Asset IDs:' }}
                </div>
            </template>
            <div v-for="(specificAssetId, index) in specificAssetIds" :key="index">
                <div class="px-2">
                    <v-list-item-title>
                        <v-hover v-slot="{ isHovering, props }">
                            <div
                                v-bind="props"
                                :class="isHovering ? 'cursor-pointer' : ''"
                                class="text-caption"
                                @click="
                                    copyToClipboard(specificAssetId.value, specificAssetId.name, getCopyIconAsRef())
                                ">
                                <span class="text-subtitle-2">{{ specificAssetId.name + ': ' }}</span>
                                <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1"
                                    >mdi-clipboard-file-outline</v-icon
                                >
                                <span>{{ specificAssetId.value }}</span>
                            </div>
                        </v-hover>
                    </v-list-item-title>
                    <ReferencePanel
                        :reference-object="specificAssetId?.semanticId"
                        :title="specificAssetId?.semanticId.keys.length > 1 ? 'Semantic IDs' : 'Semantic ID'"
                        :background-color="backgroundColor" />
                </div>
                <v-divider v-if="index < specificAssetIds.length - 1" class="my-2" />
            </div>
        </v-list-item>
    </v-container>
</template>

<script setup lang="ts">
    import { Ref, ref } from 'vue';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';

    // Composables
    const { copyToClipboard } = useClipboardUtil();

    // Props
    defineProps({
        specificAssetIds: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });

    // Data
    const copyIcon = ref<string>('mdi-clipboard-file-outline');
    const getCopyIconAsRef = (): Ref => {
        return copyIcon;
    };
</script>
