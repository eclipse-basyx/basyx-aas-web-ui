<template>
    <v-container fluid class="pa-0">
        <v-expansion-panels class="mb-n2">
            <v-expansion-panel elevation="0" tile static :color="backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <span :class="small ? 'text-caption' : 'text-subtitle-2 '">
                        {{ administrativeInformationTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text :class="'bg-' + backgroundColor">
                    <v-divider
                        v-if="
                            Array.isArray(administrativeInformationObject?.creator?.keys) &&
                            administrativeInformationObject?.creator?.keys.length > 0
                        "
                        class="mb-1"
                        opacity="0.05"></v-divider>
                    <v-list nav class="pa-0">
                        <!-- Creator -->
                        <v-list-item
                            v-if="
                                Array.isArray(administrativeInformationObject?.creator?.keys) &&
                                administrativeInformationObject?.creator?.keys.length > 0
                            "
                            class="ma-0">
                            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                                <div
                                    v-for="(creator, i) in administrativeInformationObject.creator.keys"
                                    :key="i"
                                    class="text-caption">
                                    <span v-if="creator?.type" class="font-weight-bold">{{
                                        '(' + creator.type + ') '
                                    }}</span
                                    >{{ creator.value }}
                                </div>
                            </v-tooltip>
                            <template #title>
                                <span class="text-subtitle-2">
                                    {{
                                        administrativeInformationObject.creator.keys.length === 1
                                            ? 'Creator:'
                                            : 'Creators:'
                                    }}
                                </span>
                            </template>
                            <v-list-item-subtitle
                                v-for="(creator, i) in administrativeInformationObject.creator.keys"
                                :key="i">
                                <div v-if="creator?.type" class="pt-2">
                                    <v-chip label size="x-small" border class="mr-2">{{ creator.type }}</v-chip>
                                    <span>{{ creator.value }}</span>
                                </div>
                            </v-list-item-subtitle>
                        </v-list-item>
                        <v-divider
                            v-if="
                                Array.isArray(administrativeInformationObject?.creator?.keys) &&
                                administrativeInformationObject?.creator?.keys.length > 0 &&
                                (administrativeInformationObject?.version || administrativeInformationObject?.revision)
                            "
                            class="mt-2"
                            opacity="0.05"></v-divider>
                        <!-- Version and Revision -->
                        <v-list-item
                            v-if="administrativeInformationObject?.version || administrativeInformationObject?.revision"
                            class="ma-0">
                            <v-list-item-title>
                                <template v-if="administrativeInformationObject?.version">
                                    <span class="text-subtitle-2 mt-2 mr-2">{{ 'Version:' }}</span
                                    ><v-chip label size="x-small" border class="mr-5">{{
                                        administrativeInformationObject.version
                                    }}</v-chip>
                                </template>
                                <template v-if="administrativeInformationObject?.revision">
                                    <span class="text-subtitle-2 mt-2 mr-2">{{ 'Revision:' }}</span
                                    ><v-chip label size="x-small" border class="mr-5">{{
                                        administrativeInformationObject.revision
                                    }}</v-chip>
                                </template>
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                    <v-divider
                        v-if="
                            ((Array.isArray(administrativeInformationObject?.creator?.keys) &&
                                administrativeInformationObject?.creator?.keys.length > 0) ||
                                administrativeInformationObject?.version ||
                                administrativeInformationObject?.revision) &&
                            administrativeInformationObject?.templateId
                        "
                        opacity="0.05"></v-divider>
                    <v-list nav class="pa-0">
                        <v-hover v-slot="{ isHovering, props }">
                            <v-list-item v-if="administrativeInformationObject?.templateId" class="ma-0">
                                <template #title>
                                    <span class="text-subtitle-2">
                                        {{ 'Template ID:' }}
                                    </span>
                                </template>
                                <template #subtitle>
                                    <div
                                        v-if="administrativeInformationObject.templateId"
                                        v-bind="props"
                                        :class="isHovering ? 'cursor-pointer' : ''"
                                        @click="
                                            copyToClipboard(
                                                administrativeInformationObject.templateId,
                                                'Template ID',
                                                getCopyIconAsRef()
                                            )
                                        ">
                                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                                            copyIcon
                                        }}</v-icon>
                                        <span>{{ administrativeInformationObject.templateId }}</span>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-hover>
                    </v-list>
                    <v-divider
                        v-if="
                            ((Array.isArray(administrativeInformationObject?.creator?.keys) &&
                                administrativeInformationObject?.creator?.keys.length > 0) ||
                                administrativeInformationObject?.version ||
                                administrativeInformationObject?.revision ||
                                administrativeInformationObject?.templateId) &&
                            Array.isArray(administrativeInformationObject?.embeddedDataSpecifications) &&
                            administrativeInformationObject?.embeddedDataSpecifications.length > 0
                        "
                        opacity="0.05"></v-divider>
                    <!-- Embedded Data Specifications -->
                    <v-list
                        v-if="
                            Array.isArray(administrativeInformationObject?.embeddedDataSpecifications) &&
                            administrativeInformationObject?.embeddedDataSpecifications.length > 0
                        "
                        nav
                        class="pa-0">
                        <v-card
                            v-for="(
                                embeddedDataSpecification, i
                            ) in administrativeInformationObject.embeddedDataSpecifications"
                            :key="i"
                            color="elevatedCard"
                            class="mt-2">
                            <v-list nav class="bg-elevatedCard pt-0">
                                <!-- hasDataSpecification -->
                                <SemanticID
                                    v-if="
                                        Array.isArray(embeddedDataSpecification?.dataSpecification?.keys) &&
                                        embeddedDataSpecification?.dataSpecification?.keys.length > 0
                                    "
                                    :semantic-id-object="embeddedDataSpecification.dataSpecification"
                                    :semantic-title="'Data Specification'"
                                    class="mb-2"></SemanticID>
                                <v-divider v-if="embeddedDataSpecification?.dataSpecificationContent"></v-divider>
                                <!-- dataSpecificationContent -->
                                <DataSpecificationContent
                                    v-if="embeddedDataSpecification?.dataSpecificationContent"
                                    :data-specification-object="
                                        embeddedDataSpecification?.dataSpecificationContent
                                    "></DataSpecificationContent>
                            </v-list>
                        </v-card>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    import { Ref, ref } from 'vue';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';

    // Composables
    const { copyToClipboard } = useClipboardUtil();

    // Props
    defineProps({
        administrativeInformationObject: {
            type: Object as any,
            default: {} as any,
        },
        administrativeInformationTitle: {
            type: String,
            default: 'Identification (ID)',
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
        padding-bottom: 12px !important;
    }
</style>
