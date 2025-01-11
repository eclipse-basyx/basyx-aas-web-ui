<template>
    <v-container fluid class="pa-0">
        <v-hover v-slot="{ isHovering, props }">
            <v-list-item v-if="identificationObject">
                <!-- Tooltip with ID and idShort -->
                <div>
                    <div class="d-flex justify-space-between align-center">
                        <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                            <div v-if="identificationObject?.id" class="text-caption">
                                <span class="font-weight-bold">{{ identificationName + ': ' }}</span
                                >{{ identificationObject['id'] }}
                            </div>
                            <div
                                v-if="
                                    identificationObject?.idShort &&
                                    (!identificationObject?.modelType || identificationObject.modelType !== 'Asset')
                                "
                                class="text-caption">
                                <span class="font-weight-bold">{{ 'idShort: ' }}</span
                                >{{ identificationObject['idShort'] }}
                            </div>
                        </v-tooltip>
                        <v-list-item-title>
                            <div class="text-primary text-subtitle-1">{{ nameToDisplay(identificationObject) }}</div>
                        </v-list-item-title>
                        <!-- modelType -->
                        <v-chip v-if="vChipContent" size="x-small" color="primary">{{ vChipContent }}</v-chip>
                        <v-chip
                            v-else-if="identificationObject?.modelType && identificationObject.modelType.trim() !== ''"
                            size="x-small"
                            color="primary"
                            >{{ identificationObject.modelType }}</v-chip
                        >
                    </div>
                    <!-- ID -->
                    <v-list-item v-if="identificationObject?.id" class="pa-0 mt-n2 mb-0">
                        <v-list-item-title>
                            <div>
                                {{ identificationName + ':' }}
                            </div>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            <span v-bind="props" :class="isHovering ? 'cursor-pointer' : ''" @click="copyToClipboard()">
                                <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                                    copyIcon
                                }}</v-icon>
                                <span>{{ identificationObject.id }}</span>
                            </span>
                        </v-list-item-subtitle>
                    </v-list-item>
                    <!-- idShort -->
                    <v-list-item
                        v-if="
                            identificationObject?.idShort &&
                            (!identificationObject?.modelType || identificationObject.modelType !== 'Asset')
                        "
                        class="pa-0 mb-0"
                        :class="identificationObject?.id && identificationObject?.idShort ? 'mt-n3' : 'mt-n2'">
                        <v-list-item-title>
                            <div>{{ 'idShort:' }}</div>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            <span v-bind="props" :class="isHovering ? 'cursor-pointer' : ''" @click="copyToClipboard()">
                                <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                                    copyIcon
                                }}</v-icon>
                                <span>{{ identificationObject.idShort }}</span>
                            </span>
                        </v-list-item-subtitle>
                    </v-list-item>
                </div>
            </v-list-item>
        </v-hover>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'IdentificationElement',
        mixins: [SubmodelElementHandling],
        props: {
            identificationObject: {
                type: Object as any,
                default: {} as any,
            },
            vChipContent: {
                type: String,
                default: '',
            },
            identificationName: {
                type: String,
                default: 'Identification (ID)',
            },
        },

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
            copyToClipboard() {
                if (!this.identificationObject || !this.identificationObject.id) return;
                // console.log('Copy ID to Clipboard: ', this.identificationObject.id);
                // set the icon to checkmark
                this.copyIcon = 'mdi-check';
                // copy the path to the clipboard
                navigator.clipboard.writeText(this.identificationObject.id);
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
                    text: 'ID copied to Clipboard.',
                });
            },
        },
    });
</script>
