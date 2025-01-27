<template>
    <v-container
        v-if="administrativeInformationObject && Object.keys(administrativeInformationObject).length > 0"
        fluid
        class="pa-0">
        <v-expansion-panel elevation="0" tile static :class="backgroundColor ? 'bg-' + backgroundColor : ''">
            <v-expansion-panel-title class="px-2 py-0">
                <span v-if="administrativeInformationTitle !== ''" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ administrativeInformationTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <!-- AdministrativeInformation Creator -->
                    <template v-if="hasCreator">
                        <v-list-item class="px-1 my-1">
                            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                                <div
                                    v-for="(creator, i) in administrativeInformationObject.creator.keys"
                                    :key="i"
                                    class="text-caption">
                                    <span v-if="creator?.type" class="font-weight-bold">
                                        {{ '(' + creator.type + ') ' }} </span
                                    >{{ creator.value }}
                                </div>
                            </v-tooltip>
                            <v-list-item-title class="text-subtitle-2">
                                {{ administrativeInformationObject.creator.keys.length === 1 ? 'Creator' : 'Creators' }}
                            </v-list-item-title>
                            <template v-for="(creator, i) in administrativeInformationObject.creator.keys" :key="i">
                                <v-list-item-subtitle>
                                    <v-hover v-slot="{ isHovering, props }">
                                        <div
                                            v-if="creator?.type"
                                            v-bind="props"
                                            :class="isHovering ? 'cursor-pointer' : ''"
                                            class="text-caption pt-1"
                                            @click="copyToClipboard(creator.value, creator.type, getCopyIconAsRef())">
                                            <v-chip label size="x-small" border class="mr-2">{{ creator.type }}</v-chip>
                                            <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">
                                                mdi-clipboard-file-outline
                                            </v-icon>
                                            <span>{{ creator.value }}</span>
                                        </div>
                                    </v-hover>
                                </v-list-item-subtitle>
                            </template>
                        </v-list-item>
                    </template>
                    <!-- AdministrativeInformation Version / Revision -->
                    <template v-if="hasVersion || hasRevision">
                        <v-divider v-if="hasCreator" opacity="0.05" />
                        <!-- Version and Revision -->
                        <v-list-item class="px-1 my-0">
                            <v-list-item-title>
                                <template v-if="hasVersion">
                                    <span class="text-subtitle-2 mr-2">{{ 'Version:' }}</span>
                                    <v-chip label size="x-small" border class="mr-5">
                                        {{ administrativeInformationObject.version }}
                                    </v-chip>
                                </template>
                                <template v-if="hasRevision">
                                    <span class="text-subtitle-2 mr-2">{{ 'Revision:' }}</span>
                                    <v-chip label size="x-small" border class="mr-5">
                                        {{ administrativeInformationObject.revision }}
                                    </v-chip>
                                </template>
                            </v-list-item-title>
                        </v-list-item>
                    </template>
                    <!-- AdministrativeInformation TemplateId -->
                    <template v-if="hasTemplateId">
                        <v-divider v-if="hasCreator || hasVersion || hasRevision" opacity="0.05" />
                        <v-list-item class="px-1 my-1">
                            <v-list-item-title>
                                <span class="text-subtitle-2">
                                    {{ 'Template ID:' }}
                                </span>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                <v-hover v-slot="{ isHovering, props }">
                                    <div
                                        v-bind="props"
                                        :class="isHovering ? 'cursor-pointer' : ''"
                                        @click="
                                            copyToClipboard(
                                                administrativeInformationObject.templateId,
                                                'Template ID',
                                                getCopyIconAsRef()
                                            )
                                        ">
                                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">
                                            {{ copyIcon }}
                                        </v-icon>
                                        <span>{{ administrativeInformationObject.templateId }}</span>
                                    </div>
                                </v-hover>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>
                    <!-- AdministrativeInformation EmbeddedDataSpecifications -->
                    <template v-if="hasEmbeddedDataSpecifications">
                        <!-- TODO to Test-->
                        <!-- <v-divider
                            v-if="hasCreator || hasVersion || hasRevision || hasTemplateId"
                            opacity="0.05"></v-divider>
                        <v-card
                            v-for="(
                                embeddedDataSpecification, i
                            ) in administrativeInformationObject.embeddedDataSpecifications"
                            :key="i"
                            color="elevatedCard"
                            class="mt-2">
                            <v-list nav class="bg-elevatedCard pt-0">
                                <SemanticIdElement
                                    v-if="
                                        Array.isArray(embeddedDataSpecification?.dataSpecification?.keys) &&
                                        embeddedDataSpecification?.dataSpecification?.keys.length > 0
                                    "
                                    :semantic-id-object="embeddedDataSpecification.dataSpecification"
                                    :semantic-title="'Data Specification'"
                                    class="mb-2" />
                                <v-divider v-if="embeddedDataSpecification?.dataSpecificationContent" />
                                <DataSpecificationContent
                                    v-if="embeddedDataSpecification?.dataSpecificationContent"
                                    :data-specification-object="embeddedDataSpecification?.dataSpecificationContent" />
                            </v-list>
                        </v-card> -->
                    </template>
                </v-list>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, Ref, ref } from 'vue';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';

    // Composables
    const { copyToClipboard } = useClipboardUtil();

    const props = defineProps({
        administrativeInformationObject: {
            type: Object as any,
            default: {} as any,
        },
        administrativeInformationTitle: {
            type: String,
            default: 'Administrative Information',
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

    // Computed Properties
    const hasCreator = computed(() =>
        props.administrativeInformationObject?.creator?.keys &&
        Array.isArray(props.administrativeInformationObject?.creator?.keys) &&
        props.administrativeInformationObject?.creator?.keys.length > 0
            ? true
            : false
    );
    const hasVersion = computed(() => (props.administrativeInformationObject?.version ? true : false));
    const hasRevision = computed(() => (props.administrativeInformationObject?.revision ? true : false));
    const hasTemplateId = computed(() => (props.administrativeInformationObject?.templateId ? true : false));
    const hasEmbeddedDataSpecifications = computed(() =>
        props.administrativeInformationObject?.embeddedDataSpecifications &&
        Array.isArray(props.administrativeInformationObject?.embeddedDataSpecifications) &&
        props.administrativeInformationObject?.embeddedDataSpecifications.length > 0
            ? true
            : false
    );
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 8px !important;
        padding-right: 8px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
