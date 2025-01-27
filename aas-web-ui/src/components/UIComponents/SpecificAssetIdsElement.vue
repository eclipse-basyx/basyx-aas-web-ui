<template>
    <v-container
        v-if="specificAssetIdsArray && Array.isArray(specificAssetIdsArray) && specificAssetIdsArray.length > 0"
        fluid
        class="pa-0">
        <v-expansion-panel elevation="0" tile static :class="backgroundColor ? 'bg-' + backgroundColor : ''">
            <v-expansion-panel-title class="px-2 py-0">
                <!-- Tooltip with SpecificAssetIds -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(specificAssetIdObject, i) in specificAssetIdsArray" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ specificAssetIdObject.name + ': ' }}</span>
                        {{ specificAssetIdObject.value }}
                    </div>
                </v-tooltip>
                <span v-if="specificAssetIdsArrayTitle !== ''" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ specificAssetIdsArrayTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <template v-for="(specificAssetIdObject, index) in specificAssetIdsArray" :key="index">
                        <v-divider v-if="index > 0" />
                        <v-list-item class="py-3 ma-0">
                            <v-list-item-title>
                                <span class="text-subtitle-2">
                                    {{ specificAssetIdObject.name }}
                                </span>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                <v-hover v-slot="{ isHovering, props }">
                                    <div
                                        v-bind="props"
                                        :class="isHovering ? 'cursor-pointer' : ''"
                                        @click="
                                            copyToClipboard(
                                                specificAssetIdObject.value,
                                                specificAssetIdObject.name,
                                                getCopyIconAsRef()
                                            )
                                        ">
                                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">
                                            {{ copyIcon }}
                                        </v-icon>
                                        <span>{{ specificAssetIdObject.value }}</span>
                                    </div>
                                </v-hover>
                                <SemanticIdElement
                                    :semantic-id-object="specificAssetIdObject.semanticId"
                                    :semantic-id-title="''"
                                    :with-expansion-panel="false" />
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>
                </v-list>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-container>
</template>

<script lang="ts" setup>
    import { Ref, ref } from 'vue';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';

    // Composables
    const { copyToClipboard } = useClipboardUtil();

    defineProps({
        specificAssetIdsArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        specificAssetIdsArrayTitle: {
            type: String,
            default: 'Specific Asset IDs',
        },
        small: {
            type: Boolean,
            default: false,
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

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 8px !important;
        padding-right: 8px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
