<template>
    <v-container fluid class="pa-0">
        <v-list-item>
            <!-- AdministrativeInformation Title -->
            <template #title>
                <div class="mt-2" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ administrativeInformationTitle + ':' }}
                </div>
            </template>
            <template #subtitle>
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
                                    administrativeInformationObject.creator.keys.length === 1 ? 'Creator:' : 'Creators:'
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
                        class="mt-2"></v-divider>
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
                    "></v-divider>
                <v-list nav class="pa-0">
                    <v-hover v-slot="{ isHovering, props }">
                        <v-list-item v-if="administrativeInformationObject?.templateId" class="ma-0 py-0">
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
                                    @click="copyToClipboard(administrativeInformationObject.templateId, 'Template ID')">
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
                    "></v-divider>
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
            </template>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';
    import DataSpecificationContent from './DataSpecificationContent.vue';
    import SemanticID from './SemanticID.vue';

    export default defineComponent({
        name: 'AdministrativeInformationElement',
        components: {
            SemanticID,
            DataSpecificationContent,
        },
        props: ['administrativeInformationObject', 'administrativeInformationTitle', 'small'],

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                copyIcon: 'mdi-clipboard-file-outline',
            };
        },

        methods: {
            // Function to copy the id to the clipboard
            copyToClipboard(value: string, valueName: string) {
                if (!value || !value) return;
                // console.log('Copy ID to Clipboard: ', this.identificationObject.id);
                // set the icon to checkmark
                this.copyIcon = 'mdi-check';
                // copy the path to the clipboard
                navigator.clipboard.writeText(value);
                // set the clipboard tooltip to false after 1.5 seconds
                setTimeout(() => {
                    this.copyIcon = 'mdi-clipboard-file-outline';
                }, 2000);
                // open Snackbar to inform the user that the path was copied to the clipboard
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 2000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: valueName + ' copied to Clipboard.',
                });
            },
        },
    });
</script>
